import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "./node";

const BASE = "http://localhost/api";

const get = (path: string, init?: RequestInit) => fetch(`${BASE}${path}`, init);
const send = (method: string, path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

const validNewCase = {
    title: "Printer on floor two is offline",
    description: "Nobody can print since this morning.",
    priority: "high",
    category: "bug",
    customer_id: "cust-7",
};

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => fetch(`${BASE}/test/reset`, { method: "POST" }));
afterAll(() => server.close());

describe("GET /api/cases", () => {
    it("returns the first page of 1000 seeded cases, newest first", async () => {
        const body = await (await get("/cases")).json();
        expect(body).toMatchObject({ page: 1, page_size: 20, total: 1000 });
        expect(body.items).toHaveLength(20);
        const dates: string[] = body.items.map((item: { created_at: string }) => item.created_at);
        expect(dates).toEqual([...dates].sort().reverse());
    });

    it("paginates and returns an empty page past the end", async () => {
        const last = await (await get("/cases?page=50")).json();
        const beyond = await (await get("/cases?page=51")).json();
        expect(last.items).toHaveLength(20);
        expect(beyond.items).toHaveLength(0);
        expect(beyond.total).toBe(1000);
    });

    it("filters by comma-separated status and priority", async () => {
        const body = await (await get("/cases?status=new,closed&priority=urgent&page_size=100")).json();
        expect(body.total).toBeGreaterThan(0);
        for (const item of body.items) {
            expect(["new", "closed"]).toContain(item.status);
            expect(item.priority).toBe("urgent");
        }
    });

    it("searches reference, title and customer name", async () => {
        const byCustomer = await (await get("/cases?q=northwind&page_size=100")).json();
        const byReference = await (await get("/cases?q=CF-1042")).json();
        expect(byCustomer.total).toBeGreaterThan(0);
        expect(byReference.items.map((item: { reference: string }) => item.reference)).toEqual(["CF-1042"]);
    });

    it("sorts by priority ascending and rejects unknown sort fields", async () => {
        const body = await (await get("/cases?sort=priority&page_size=100")).json();
        expect(body.items[0].priority).toBe("low");
        const bad = await get("/cases?sort=title");
        expect(bad.status).toBe(400);
        expect((await bad.json()).error.code).toBe("validation_failed");
    });

    it("always produces the same seed", async () => {
        const first = await (await get("/cases?page_size=5")).json();
        await fetch(`${BASE}/test/reset`, { method: "POST" });
        const second = await (await get("/cases?page_size=5")).json();
        expect(second).toEqual(first);
    });
});

describe("case detail, create and update", () => {
    it("returns one case or 404 not_found", async () => {
        expect((await (await get("/cases/c-0042")).json()).reference).toBe("CF-1042");
        const missing = await get("/cases/c-9999");
        expect(missing.status).toBe(404);
        expect((await missing.json()).error.code).toBe("not_found");
    });

    it("creates a new case, or 400 with field errors", async () => {
        const created = await send("POST", "/cases", validNewCase);
        expect(created.status).toBe(201);
        expect(await created.json()).toMatchObject({ status: "new", reference: "CF-2001", assignee_id: null });

        const bad = await send("POST", "/cases", { ...validNewCase, title: "Hi" });
        expect(bad.status).toBe(400);
        expect((await bad.json()).error.fields.title).toBeDefined();
    });

    it("allows valid status changes and rejects invalid ones with 409", async () => {
        const created = await (await send("POST", "/cases", validNewCase)).json();
        const ok = await send("PATCH", `/cases/${created.id}`, { status: "in_progress" });
        expect((await ok.json()).status).toBe("in_progress");

        const invalid = await send("PATCH", `/cases/${created.id}`, { status: "closed" });
        expect(invalid.status).toBe(409);
        expect((await invalid.json()).error.code).toBe("invalid_transition");
    });
});

describe("other endpoints, reset and error injection", () => {
    it("lists the seed users and 12 customers", async () => {
        expect(await (await get("/users")).json()).toHaveLength(4);
        expect(await (await get("/customers")).json()).toHaveLength(12);
    });

    it("reset removes created cases", async () => {
        await send("POST", "/cases", validNewCase);
        expect((await (await get("/cases")).json()).total).toBe(1001);
        expect((await fetch(`${BASE}/test/reset`, { method: "POST" })).status).toBe(204);
        expect((await (await get("/cases")).json()).total).toBe(1000);
    });

    it("forces an error with the x-mock-fail header or the mock_fail query param", async () => {
        const byHeader = await get("/cases", { headers: { "x-mock-fail": "500" } });
        expect(byHeader.status).toBe(500);
        expect((await byHeader.json()).error.code).toBe("internal_error");

        const byQuery = await get("/cases/c-0001?mock_fail=409");
        expect(byQuery.status).toBe(409);
    });

    it("adds latency with x-mock-delay", async () => {
        const started = Date.now();
        await get("/users", { headers: { "x-mock-delay": "150" } });
        expect(Date.now() - started).toBeGreaterThanOrEqual(140);
    });
});
