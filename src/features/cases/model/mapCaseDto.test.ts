import { describe, expect, it } from "vitest";
import { mapCaseDto } from "./mapCaseDto";

const validDto = {
    id: "c-0042",
    reference: "CF-1042",
    title: "Cannot export monthly report",
    description: "Export button spins forever for March.",
    status: "new",
    priority: "high",
    category: "bug",
    customer: { id: "cust-7", name: "Northwind Health", email: "it@northwind.example" },
    assignee_id: null,
    tags: ["reports"],
    created_at: "2026-09-14T09:12:00Z",
    updated_at: "2026-09-14T09:12:00Z",
    due_at: null,
};

describe("mapCaseDto", () => {
    it("maps a valid DTO to a camelCase Case with Date objects", () => {
        expect(mapCaseDto(validDto)).toEqual({
            id: "c-0042",
            reference: "CF-1042",
            title: "Cannot export monthly report",
            description: "Export button spins forever for March.",
            status: "new",
            priority: "high",
            category: "bug",
            customer: { id: "cust-7", name: "Northwind Health", email: "it@northwind.example" },
            assigneeId: null,
            tags: ["reports"],
            createdAt: new Date("2026-09-14T09:12:00Z"),
            updatedAt: new Date("2026-09-14T09:12:00Z"),
            dueAt: null,
        });
    });

    it("converts assignee_id and due_at when they are set", () => {
        const result = mapCaseDto({ ...validDto, assignee_id: "u-2", due_at: "2026-09-20T00:00:00Z" });
        expect(result?.assigneeId).toBe("u-2");
        expect(result?.dueAt).toEqual(new Date("2026-09-20T00:00:00Z"));
    });

    it.each([
        ["invalid status", { status: "bogus" }],
        ["title too short", { title: "Hi" }],
        ["invalid date", { created_at: "not-a-date" }],
    ])("returns null for %s", (_name, override) => {
        expect(mapCaseDto({ ...validDto, ...override })).toBeNull();
    });

    it.each([undefined, null, {}])("returns null for garbage input %s", (input) => {
        expect(mapCaseDto(input)).toBeNull();
    });
});
