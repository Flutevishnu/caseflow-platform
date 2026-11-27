# CaseFlow Architecture

CaseFlow is a React SPA (see [ADR 0001](adr/0001-rendering-strategy.md)) organised by feature. It talks to a mock backend (MSW) that follows the API contract in the brief.

## Component diagram

```mermaid
flowchart TD
    Main[main.tsx] --> App[App]
    App --> Router[RouterProvider / routes.tsx]
    Router --> Layout[Layout: nav + Outlet]
    Layout --> List[CaseListPage]
    Layout --> New[CaseNewPage]
    Layout --> Detail[CaseDetailPage]
    Router --> NotFound[NotFoundPage]

    subgraph features/cases
        List --> Hooks[hooks]
        New --> Hooks
        Detail --> Hooks
        Hooks --> Api[api client]
        Api --> Model[model: CaseDto, Case, mapCaseDto]
    end

    List --> UI[shared/ui]
    New --> UI
    Detail --> UI
```

## Data-flow diagram

```mermaid
flowchart LR
    User((User)) --> Page[Page component]
    Page -->|calls| Hook[Feature hook]
    Hook -->|fetch /api/cases| Api[API client]
    Api -->|HTTP| MSW[(MSW mock backend)]
    MSW -->|CaseDto JSON, snake_case| Api
    Api -->|Zod validates| Mapper[mapCaseDto]
    Mapper -->|Case, camelCase + Date| Hook
    Hook -->|data| Page
    Page -->|renders| User
```

Invalid DTOs are rejected at the boundary, so the UI only ever sees valid `Case` objects.

## State taxonomy

| State type              | What it holds in CaseFlow                                         | Tool                                          | Why                                           |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| **Server state**        | Cases, users and customers from `/api`                            | TanStack Query                                | Caching, loading and error states, refetching |
| **URL state**           | List search `q`, `status`, `priority`, `sort`, `page`; case `:id` | React Router (`useSearchParams`, `useParams`) | Shareable, bookmarkable, survives refresh     |
| **Form state**          | Create and edit case form fields and validation errors            | React Hook Form with the Zod schema           | Handles field state and validation            |
| **Local UI state**      | Open dialogs, dropdowns, toggles                                  | `useState`                                    | Only one component needs it                   |
| **Global client state** | Simulated current role (viewer, agent, admin)                     | React Context                                 | Needed across the whole app, rarely change    |
