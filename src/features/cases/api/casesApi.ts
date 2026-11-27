import * as z from "zod";
import type { Case } from "../model/case";
import { mapCaseDto } from "../model/mapCaseDto";

const listResponseSchema = z.object({
    items: z.array(z.unknown()),
    page: z.number(),
    page_size: z.number(),
    total: z.number(),
});

export type CaseListParams = {
    q: string;
    status: string;
    priority: string;
    sort: string;
    page: number;
    pageSize?: number;
};

export type CaseListResult = {
    items: Case[];
    page: number;
    pageSize: number;
    total: number;
};

async function readError(response: Response) {
    try {
        const body = await response.json();
        return body?.error?.message ?? `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
}

export async function fetchCases(params: CaseListParams, signal?: AbortSignal): Promise<CaseListResult> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (params.priority) query.set("priority", params.priority);
    query.set("sort", params.sort);
    query.set("page", String(params.page));
    query.set("page_size", String(params.pageSize ?? 20));

    const response = await fetch(`/api/cases?${query}`, { signal });
    if (!response.ok) throw new Error(await readError(response));

    const body = listResponseSchema.parse(await response.json());
    return {
        items: body.items.map(mapCaseDto).filter((item): item is Case => item !== null),
        page: body.page,
        pageSize: body.page_size,
        total: body.total,
    };
}
