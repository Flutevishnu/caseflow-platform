// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { setupMockApi } from "@/mocks/setupMockApi";
import { CaseListPage } from "./CaseListPage";

setupMockApi();

function renderList(path = "/cases") {
    const router = createMemoryRouter([{ path: "/cases", Component: CaseListPage }], { initialEntries: [path] });
    render(<RouterProvider router={router} />);
    return router;
}

describe("CaseListPage", () => {
    it("shows the first page of cases from the API", async () => {
        renderList();
        await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(21));
    });

    it("writes the search text to the URL and filters the rows", async () => {
        const router = renderList();
        await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(21));

        fireEvent.change(screen.getByLabelText("Search"), { target: { value: "CF-1042" } });

        await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
        expect(router.state.location.search).toBe("?q=CF-1042");
        expect(screen.getByText("CF-1042")).toBeTruthy();
    });

    it("shows an error alert when the API fails", async () => {
        server.use(
            http.get("*/api/cases", () =>
                HttpResponse.json({ error: { code: "internal_error", message: "Boom" } }, { status: 500 }),
            ),
        );
        renderList();
        expect(await screen.findByText("Could not load cases")).toBeTruthy();
        expect(screen.getByText("Boom")).toBeTruthy();
    });
});
