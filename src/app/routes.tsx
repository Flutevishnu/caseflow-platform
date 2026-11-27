import { createBrowserRouter, redirect } from "react-router";
import type { RouteObject } from "react-router";
import { Layout } from "./layout";
import { NotFoundPage } from "./NotFoundPage";

export const routes: RouteObject[] = [
    {
        path: "/",
        Component: Layout,
        children: [
            {
                index: true,
                loader: async () => redirect("/cases")
            },
            {
                path: "cases",
                lazy: async () => ({
                    Component: (await import("@/features/cases/components/CaseListPage")).CaseListPage
            })
                
            },
            { 
                path: "cases/new",
                lazy: async () => ({
                    Component: (await import("@/features/cases/components/CaseNewPage")).CaseNewPage
                })
            },
            {
                path: "cases/:id",
                lazy: async () => ({
                    Component: (await import("@/features/cases/components/CaseDetailPage")).CaseDetailPage
                })
            },
            {
                path: "*",
                Component: NotFoundPage
            }

        ]
    }
]

export const router = createBrowserRouter(routes)