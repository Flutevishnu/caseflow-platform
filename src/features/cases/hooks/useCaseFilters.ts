import { useSearchParams } from "react-router";
import { PRIORITY, STATUS } from "../model/caseDto";

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | "" {
    return allowed.find((item) => item === value) ?? "";
}


export function useCaseFilters() {
    const [searchParams, setSearchParams] = useSearchParams();

    const q = searchParams.get("q") ?? "";
    const status = oneOf(STATUS, searchParams.get("status"));
    const priority = oneOf(PRIORITY, searchParams.get("priority"));
    const sort = searchParams.get("sort") ?? "-created_at";
    const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);

    function update(changes: Record<string, string>, options?: { replace?: boolean }) {
        setSearchParams(
            (previous) => {
                const next = new URLSearchParams(previous);
                for (const [key, value] of Object.entries(changes)) {
                    if (value) next.set(key, value);
                    else next.delete(key);
                }
                if (!("page" in changes)) next.delete("page");
                return next;
            },
            { replace: options?.replace },
        );
    }

    return { q, status, priority, sort, page, update };
}