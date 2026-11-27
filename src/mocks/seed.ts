import { CATEGORY, PRIORITY, STATUS } from "@/features/cases";
import type { CaseDto } from "@/features/cases";

export const SEED_COUNT = 1000;

const ANCHOR = Date.UTC(2026, 10, 27, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

export const users = [
    { id: "u-1", name: "Priya Shah", role: "admin" },
    { id: "u-2", name: "Marcus Lee", role: "agent" },
    { id: "u-3", name: "Sofia Romero", role: "agent" },
    { id: "u-4", name: "Tom Becker", role: "viewer" },
];

export const customers = [
    { id: "cust-1", name: "Acme Logistics", email: "it@acme-logistics.example" },
    { id: "cust-2", name: "Bluebird Finance", email: "it@bluebird.example" },
    { id: "cust-3", name: "Cascade Energy", email: "it@cascade.example" },
    { id: "cust-4", name: "Delta Retail", email: "it@delta-retail.example" },
    { id: "cust-5", name: "Evergreen Schools", email: "it@evergreen.example" },
    { id: "cust-6", name: "Fjord Marine", email: "it@fjord-marine.example" },
    { id: "cust-7", name: "Northwind Health", email: "it@northwind.example" },
    { id: "cust-8", name: "Orchid Hotels", email: "it@orchid.example" },
    { id: "cust-9", name: "Pioneer Telecom", email: "it@pioneer.example" },
    { id: "cust-10", name: "Quartz Legal", email: "it@quartz-legal.example" },
    { id: "cust-11", name: "Redwood Insurance", email: "it@redwood.example" },
    { id: "cust-12", name: "Summit Outdoors", email: "it@summit.example" },
];

const TITLES = [
    "Cannot export monthly report",
    "Login page shows a blank screen",
    "Request access to the billing dashboard",
    "How do I change the notification settings?",
    "Invoice PDF is missing the company logo",
    "Search returns no results for exact matches",
    "Need an extra seat for a new team member",
    "Dashboard charts load very slowly",
    "Password reset email never arrives",
    "Add dark mode to the customer portal",
    "Duplicate entries after CSV import",
    "Unable to upload files larger than 10 MB",
    "Request admin rights for the reporting tool",
    "What is the data retention period?",
    "Mobile layout breaks on small screens",
    "Webhook deliveries are failing intermittently",
    "Allow bulk editing of case priorities",
    "Two-factor prompt appears twice",
    "Date filter ignores the selected timezone",
    "Need a sandbox account for training",
];

const DESCRIPTIONS = [
    "The problem started after the last release and affects the whole team.",
    "Happens every time and can be reproduced on two different browsers.",
    "The customer has asked for an update before the end of the week.",
    "Screenshots and logs have been shared in the support thread.",
    "Only one user is affected so far, but more reports are expected.",
    "Please advise on the recommended approach and expected timeline.",
];

const TAGS = ["reports", "login", "billing", "performance", "mobile", "import", "security", "ui"];

function createRandom(seed: number) {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function toIso(ms: number) {
    return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function createSeedCases(): CaseDto[] {
    const random = createRandom(42);
    const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
    const assignees = ["u-1", "u-2", "u-3"];

    return Array.from({ length: SEED_COUNT }, (_, index) => {
        const number = index + 1;
        const status = pick(STATUS);
        const createdMs = Math.floor((ANCHOR - random() * 90 * DAY) / 1000) * 1000;
        const updatedMs =
            status === "new"
                ? createdMs
                : Math.floor((createdMs + random() * (ANCHOR - createdMs)) / 1000) * 1000;
        const tagCount = Math.floor(random() * 3);
        const tags = [...new Set(Array.from({ length: tagCount }, () => pick(TAGS)))];

        return {
            id: `c-${String(number).padStart(4, "0")}`,
            reference: `CF-${1000 + number}`,
            title: pick(TITLES),
            description: pick(DESCRIPTIONS),
            status,
            priority: pick(PRIORITY),
            category: pick(CATEGORY),
            customer: { ...pick(customers) },
            assignee_id: status === "new" ? null : pick(assignees),
            tags,
            created_at: toIso(createdMs),
            updated_at: toIso(updatedMs),
            due_at: random() < 0.3 ? toIso(createdMs + (3 + Math.floor(random() * 12)) * DAY) : null,
        };
    });
}
