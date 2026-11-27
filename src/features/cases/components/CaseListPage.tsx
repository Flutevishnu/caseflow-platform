import { Alert, Badge, Pagination, Select, Table, TextField } from "innovations-ui-kit";
import type { BadgeTone, SortState, TableColumn } from "innovations-ui-kit";
import { useCaseFilters } from "../hooks/useCaseFilters";
import { useCases } from "../hooks/useCases";
import type { Case } from "../model/case";
import { PRIORITY, STATUS } from "../model/caseDto";

const humanize = (value: string) => value.replace(/_/g, " ");

const toOptions = (values: readonly string[]) => [
    { value: "", label: "All" },
    ...values.map((value) => ({ value, label: humanize(value) })),
];

const STATUS_TONE: Record<Case["status"], BadgeTone> = {
    new: "info",
    in_progress: "info",
    waiting_on_customer: "warning",
    resolved: "success",
    closed: "neutral",
};

const PRIORITY_TONE: Record<Case["priority"], BadgeTone> = {
    low: "neutral",
    medium: "info",
    high: "warning",
    urgent: "danger",
};

const columns: TableColumn<Case>[] = [
    { key: "reference", header: "Reference", cell: (c) => c.reference, sortValue: (c) => c.reference },
    { key: "title", header: "Title", cell: (c) => c.title },
    {
        key: "status",
        header: "Status",
        cell: (c) => <Badge tone={STATUS_TONE[c.status]}>{humanize(c.status)}</Badge>,
    },
    {
        key: "priority",
        header: "Priority",
        cell: (c) => <Badge tone={PRIORITY_TONE[c.priority]}>{c.priority}</Badge>,
        sortValue: (c) => PRIORITY.indexOf(c.priority),
    },
    {
        key: "created_at",
        header: "Created",
        cell: (c) => c.createdAt.toLocaleDateString(),
        sortValue: (c) => c.createdAt.getTime(),
    },
];

export function CaseListPage() {
    const { q, status, priority, sort, page, update } = useCaseFilters();

    const { data, error, loading } = useCases({ q, status, priority, sort, page });
    const cases = data?.items ?? [];
    const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

    const sortState: SortState = {
        key: sort.replace(/^-/, ""),
        direction: sort.startsWith("-") ? "desc" : "asc",
    };

    return (
        <>
            <h1>Cases</h1>

            <form role="search" aria-label="Filter cases" onSubmit={(e) => e.preventDefault()}>
                <TextField
                    label="Search"
                    type="search"
                    value={q}
                    onChange={(e) => update({ q: e.target.value }, { replace: true })}
                />
                <Select
                    label="Status"
                    options={toOptions(STATUS)}
                    value={status}
                    onChange={(e) => update({ status: e.target.value })}
                />
                <Select
                    label="Priority"
                    options={toOptions(PRIORITY)}
                    value={priority}
                    onChange={(e) => update({ priority: e.target.value })}
                />
            </form>

            {error && <Alert tone="danger" title="Could not load cases">{error}</Alert>}
            {loading && <p role="status">Loading cases...</p>}

            <Table
                caption="Cases"
                columns={columns}
                rows={cases}
                getRowId={(c) => c.id}
                sort={sortState}
                onSortChange={(next) =>
                    update({ sort: next ? `${next.direction === "desc" ? "-" : ""}${next.key}` : "" })
                }
                emptyMessage="No cases match your filters."
            />

            <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={(next) => update({ page: next === 1 ? "" : String(next) })}
                aria-label="Case list pages"
            />
        </>
    );
}
