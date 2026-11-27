import type { CaseDto } from "@/features/cases";
import { SEED_COUNT, createSeedCases } from "./seed";

let cases: CaseDto[] = createSeedCases();
let nextNumber = SEED_COUNT + 1;

export function getCases() {
    return cases;
}

export function findCase(id: string) {
    return cases.find((item) => item.id === id);
}

export function addCase(build: (id: string, reference: string) => CaseDto) {
    const created = build(`c-${String(nextNumber).padStart(4, "0")}`, `CF-${1000 + nextNumber}`);
    nextNumber += 1;
    cases = [created, ...cases];
    return created;
}

export function replaceCase(updated: CaseDto) {
    cases = cases.map((item) => (item.id === updated.id ? updated : item));
    return updated;
}

export function resetDb() {
    cases = createSeedCases();
    nextNumber = SEED_COUNT + 1;
}
