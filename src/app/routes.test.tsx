// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { setupMockApi } from "@/mocks/setupMockApi";
import { routes } from "./routes";

setupMockApi();

function renderAt(path: string) {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
    return router;
}

describe("routes", () => {
    it("redirects / to /cases", async () => {
        const router = renderAt("/");
        await screen.findByRole("heading", { name: "Cases" });
        expect(router.state.location.pathname).toBe("/cases");
    });

    it("renders the new case page at /cases/new", async () => {
        renderAt("/cases/new");
        expect(await screen.findByRole("heading", { name: "New Case Page" })).toBeTruthy();
    });

    it("renders the detail page at /cases/:id", async () => {
        renderAt("/cases/c-0042");
        expect(await screen.findByRole("heading", { name: "case Detail page" })).toBeTruthy();
    });

    it("shows the 404 page with a link back to /cases for unknown URLs", async () => {
        renderAt("/does-not-exist");
        expect(await screen.findByRole("heading", { name: "Page Not found" })).toBeTruthy();
        expect(screen.getByRole("link", { name: "Return to cases" }).getAttribute("href")).toBe("/cases");
    });
});
