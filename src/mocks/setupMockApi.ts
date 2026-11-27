import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./node";

export function setupMockApi() {
    beforeAll(() => {
        server.listen({ onUnhandledFrame: "error" });
        const realFetch = globalThis.fetch;
        vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
            realFetch(typeof input === "string" && input.startsWith("/") ? `http://localhost${input}` : input, init),
        );
    });

    afterEach(async () => {
        cleanup();
        server.resetHandlers();
        await fetch("/api/test/reset", { method: "POST" });
    });

    afterAll(() => {
        vi.unstubAllGlobals();
        server.close();
    });
}
