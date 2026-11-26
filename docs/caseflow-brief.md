# CaseFlow — product brief and API contract

Owner: Innovations Lab Product · Used from Day 9 to Day 15

CaseFlow is an internal case-management tool for the lab's client-support team. Clients raise
cases (bugs, access requests, questions); support agents triage, work and resolve them; admins
manage the queue. You build the frontend against a mock backend (MSW) that follows the contract
below exactly, so that a real backend could replace it later.

## Users and roles

| Role | Can |
| --- | --- |
| `viewer` | Read cases. Cannot create or change anything. |
| `agent` | Everything a viewer can, plus create cases and edit/change status of cases. |
| `admin` | Everything an agent can, plus close and reopen cases. |

Roles are simulated on the client (Day 10 role switcher). Document in `docs/security.md` why this
is not real authorisation.

Seed users (use these ids in data):

| id | name | role |
| --- | --- | --- |
| `u-1` | Priya Shah | admin |
| `u-2` | Marcus Lee | agent |
| `u-3` | Sofia Romero | agent |
| `u-4` | Tom Becker | viewer |

## Pages

- `/cases` — paginated, searchable, filterable, sortable list. All list state lives in the URL
  (`?q=&status=&priority=&sort=&page=`).
- `/cases/new` — create form.
- `/cases/:id` — detail with edit and status actions.
- Anything else — 404 page with a link back to `/cases`.

## Case lifecycle

```
new → in_progress → waiting_on_customer → in_progress → resolved → closed
                    └──────────────→ resolved
resolved → in_progress   (reopen, admin only)
closed   → in_progress   (reopen, admin only)
```

Any other transition is invalid; the API rejects it with `409`.

## Data contract (what the API returns — snake_case DTO)

```json
{
  "id": "c-0042",
  "reference": "CF-1042",
  "title": "Cannot export monthly report",
  "description": "Export button spins forever for March.",
  "status": "new",
  "priority": "high",
  "category": "bug",
  "customer": { "id": "cust-7", "name": "Northwind Health", "email": "it@northwind.example" },
  "assignee_id": null,
  "tags": ["reports"],
  "created_at": "2026-09-14T09:12:00Z",
  "updated_at": "2026-09-14T09:12:00Z",
  "due_at": null
}
```

- `status`: `new` | `in_progress` | `waiting_on_customer` | `resolved` | `closed`
- `priority`: `low` | `medium` | `high` | `urgent`
- `category`: `bug` | `access` | `question` | `feature_request`
- `title` 5–120 chars; `description` up to 4000 chars; timestamps are ISO 8601 UTC.

Your domain model (`Case`) should be camelCase with `Date` objects; `mapCaseDto` converts, and a Zod
schema validates the DTO at the boundary. Reject or safely handle anything that does not parse.

## API

All endpoints are under `/api`. Errors always use:

```json
{ "error": { "code": "validation_failed", "message": "Title is too short", "fields": { "title": "Enter at least 5 characters" } } }
```

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/cases?page=1&page_size=20&q=&status=&priority=&sort=-created_at` | Returns `{ "items": [CaseDto], "page": 1, "page_size": 20, "total": 1000 }`. `sort` is a field name, `-` prefix for descending; allowed: `created_at`, `updated_at`, `priority`, `reference`. `status`/`priority` accept comma-separated lists. `q` matches reference, title and customer name. |
| GET | `/api/cases/:id` | `404` with `not_found` if missing. |
| POST | `/api/cases` | Body: `title`, `description`, `priority`, `category`, `customer_id`, `tags?`, `due_at?`. Returns `201` with the case (`status: new`). `400 validation_failed` with `fields` on bad input. |
| PATCH | `/api/cases/:id` | Partial update of editable fields and `status`. `409 invalid_transition` for disallowed status changes. |
| GET | `/api/users` | Seed users above. |
| GET | `/api/customers` | 12 seed customers `{ id, name, email }`. |
| POST | `/api/test/reset` | Restores the deterministic seed. Used by tests. |

### Seed data

Generate **1000 cases** deterministically (fixed seed, no `Math.random()` without a seed) so that
tests and screenshots are stable. Spread statuses, priorities, categories, customers and dates
across the last 90 days.

### Error injection (for resilience tests)

- Header `x-mock-fail: 500` (or `404`, `409`) on any request forces that error.
- Header `x-mock-delay: 2000` adds latency in milliseconds.
- Also allow the same via query params `?mock_fail=500&mock_delay=2000` for manual testing.

## Non-functional

- WCAG 2.2 AA; keyboard operable; visible focus.
- Case list stays responsive with 1000 cases (Day 10 virtualisation).
- Reuse the Innovations UI Kit components; no new one-off buttons or inputs.