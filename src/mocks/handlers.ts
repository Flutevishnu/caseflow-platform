import { http, HttpResponse } from "msw/http";
import { delay } from "msw/utils/delay";
import { CATEGORY, PRIORITY, STATUS } from "@/features/cases";
import type { CaseDto } from "@/features/cases";
import { addCase, findCase, getCases, replaceCase, resetDb } from "./db";
import { customers, toIso, users } from "./seed";

const API = "*/api";

type Status = CaseDto["status"];
type Fields = Record<string, string>;

const SORT_FIELDS = ["created_at", "updated_at", "priority", "reference"] as const;
const EDITABLE = ["title", "description", "priority", "category", "tags", "due_at", "assignee_id", "status"];

const TRANSITIONS: Record<Status, readonly Status[]> = {
    new: ["in_progress"],
    in_progress: ["waiting_on_customer", "resolved"],
    waiting_on_customer: ["in_progress", "resolved"],
    resolved: ["closed", "in_progress"],
    closed: ["in_progress"],
};

const FAILURES: Record<number, { code: string; message: string }> = {
    500: { code: "internal_error", message: "Something went wrong on the server" },
    404: { code: "not_found", message: "The requested resource was not found" },
    409: { code: "conflict", message: "The request conflicts with the current state" },
};

function errorResponse(status: number, code: string, message: string, fields?: Fields) {
    return HttpResponse.json({ error: { code, message, ...(fields && { fields }) } }, { status });
}

async function injectFaults(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const delayMs = Number(request.headers.get("x-mock-delay") ?? url.searchParams.get("mock_delay"));
    if (delayMs > 0) await delay(delayMs);

    const failStatus = Number(request.headers.get("x-mock-fail") ?? url.searchParams.get("mock_fail"));
    const failure = FAILURES[failStatus];
    if (failure) return errorResponse(failStatus, failure.code, failure.message);
}

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
    return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function positiveInt(value: string | null, fallback: number) {
    const number = Math.floor(Number(value));
    return Number.isFinite(number) && number >= 1 ? number : fallback;
}

function csv(value: string | null) {
    return value ? value.split(",").map((part) => part.trim()).filter(Boolean) : [];
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
    try {
        const body: unknown = await request.clone().json();
        return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

function validate(body: Record<string, unknown>, isCreate: boolean): Fields {
    const fields: Fields = {};
    const check = (key: string) => isCreate || key in body;

    if (check("title")) {
        const title = body.title;
        if (typeof title !== "string" || title.trim().length < 5) fields.title = "Enter at least 5 characters";
        else if (title.trim().length > 120) fields.title = "Enter at most 120 characters";
    }
    if (check("description")) {
        if (typeof body.description !== "string") fields.description = "Enter a description";
        else if (body.description.length > 4000) fields.description = "Enter at most 4000 characters";
    }
    if (check("priority") && !isOneOf(PRIORITY, body.priority)) fields.priority = "Choose a priority";
    if (check("category") && !isOneOf(CATEGORY, body.category)) fields.category = "Choose a category";
    if (isCreate && !customers.some((customer) => customer.id === body.customer_id)) {
        fields.customer_id = "Choose a customer";
    }
    if ("tags" in body && !(Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === "string"))) {
        fields.tags = "Tags must be a list of text";
    }
    if ("due_at" in body && body.due_at !== null && (typeof body.due_at !== "string" || Number.isNaN(Date.parse(body.due_at)))) {
        fields.due_at = "Enter a valid date";
    }
    if (!isCreate && "assignee_id" in body && body.assignee_id !== null && !users.some((user) => user.id === body.assignee_id)) {
        fields.assignee_id = "Choose a valid assignee";
    }
    if (!isCreate && "status" in body && !isOneOf(STATUS, body.status)) fields.status = "Choose a valid status";
    return fields;
}

function editableFields(body: Record<string, unknown>): Partial<CaseDto> {
    const changes: Record<string, unknown> = {};
    for (const key of EDITABLE) if (key in body) changes[key] = body[key];
    if (typeof changes.title === "string") changes.title = changes.title.trim();
    if (typeof changes.due_at === "string") changes.due_at = toIso(Date.parse(changes.due_at));
    return changes as Partial<CaseDto>;
}

export const handlers = [
    http.get(`${API}/cases`, async ({ request }) => {
        const injected = await injectFaults(request);
        if (injected) return injected;

        const params = new URL(request.url).searchParams;
        const page = positiveInt(params.get("page"), 1);
        const pageSize = Math.min(positiveInt(params.get("page_size"), 20), 100);
        const statuses = csv(params.get("status"));
        const priorities = csv(params.get("priority"));
        const query = (params.get("q") ?? "").trim().toLowerCase();
        const sortParam = params.get("sort") ?? "-created_at";
        const descending = sortParam.startsWith("-");
        const sortField = descending ? sortParam.slice(1) : sortParam;

        const invalid: Fields = {};
        const badStatus = statuses.find((value) => !isOneOf(STATUS, value));
        const badPriority = priorities.find((value) => !isOneOf(PRIORITY, value));
        if (badStatus) invalid.status = `Unknown status "${badStatus}"`;
        if (badPriority) invalid.priority = `Unknown priority "${badPriority}"`;
        if (!isOneOf(SORT_FIELDS, sortField)) invalid.sort = `Sort must be one of: ${SORT_FIELDS.join(", ")}`;
        if (Object.keys(invalid).length > 0) {
            return errorResponse(400, "validation_failed", "Invalid query parameters", invalid);
        }

        const field = sortField as (typeof SORT_FIELDS)[number];
        const matches = getCases().filter(
            (item) =>
                (statuses.length === 0 || statuses.includes(item.status)) &&
                (priorities.length === 0 || priorities.includes(item.priority)) &&
                (query === "" ||
                    [item.reference, item.title, item.customer.name].some((value) => value.toLowerCase().includes(query))),
        );

        const compare = (a: CaseDto, b: CaseDto) => {
            const result =
                field === "priority"
                    ? PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(b.priority)
                    : a[field].localeCompare(b[field]);
            return (descending ? -result : result) || a.id.localeCompare(b.id);
        };
        const sorted = [...matches].sort(compare);
        const start = (page - 1) * pageSize;

        return HttpResponse.json({
            items: sorted.slice(start, start + pageSize),
            page,
            page_size: pageSize,
            total: sorted.length,
        });
    }),

    http.get<{ id: string }>(`${API}/cases/:id`, async ({ request, params }) => {
        const injected = await injectFaults(request);
        if (injected) return injected;

        const found = findCase(params.id);
        return found ? HttpResponse.json(found) : errorResponse(404, "not_found", "Case not found");
    }),

    http.post(`${API}/cases`, async ({ request }) => {
        const injected = await injectFaults(request);
        if (injected) return injected;

        const body = await readBody(request);
        if (!body) return errorResponse(400, "validation_failed", "Request body must be a JSON object");

        const fields = validate(body, true);
        if (Object.keys(fields).length > 0) return errorResponse(400, "validation_failed", "Validation failed", fields);

        const now = toIso(Date.now());
        const customer = customers.find((item) => item.id === body.customer_id)!;
        const created = addCase((id, reference) => ({
            id,
            reference,
            tags: [],
            due_at: null,
            ...editableFields(body),
            status: "new",
            assignee_id: null,
            customer: { ...customer },
            created_at: now,
            updated_at: now,
        }) as CaseDto);
        return HttpResponse.json(created, { status: 201 });
    }),

    http.patch<{ id: string }>(`${API}/cases/:id`, async ({ request, params }) => {
        const injected = await injectFaults(request);
        if (injected) return injected;

        const existing = findCase(params.id);
        if (!existing) return errorResponse(404, "not_found", "Case not found");

        const body = await readBody(request);
        if (!body) return errorResponse(400, "validation_failed", "Request body must be a JSON object");

        const fields = validate(body, false);
        if (Object.keys(fields).length > 0) return errorResponse(400, "validation_failed", "Validation failed", fields);

        const changes = editableFields(body);
        if (changes.status && changes.status !== existing.status && !TRANSITIONS[existing.status].includes(changes.status)) {
            return errorResponse(409, "invalid_transition", `Cannot change status from ${existing.status} to ${changes.status}`);
        }

        return HttpResponse.json(replaceCase({ ...existing, ...changes, updated_at: toIso(Date.now()) }));
    }),

    http.get(`${API}/users`, async ({ request }) => {
        const injected = await injectFaults(request);
        return injected ?? HttpResponse.json(users);
    }),

    http.get(`${API}/customers`, async ({ request }) => {
        const injected = await injectFaults(request);
        return injected ?? HttpResponse.json(customers);
    }),

    http.post(`${API}/test/reset`, async ({ request }) => {
        const injected = await injectFaults(request);
        if (injected) return injected;

        resetDb();
        return new HttpResponse(null, { status: 204 });
    }),
];
