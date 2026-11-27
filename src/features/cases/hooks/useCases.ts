import { useEffect, useState } from "react";
import { fetchCases } from "../api/casesApi";
import type { CaseListParams, CaseListResult } from "../api/casesApi";

type Result = { key: string; data?: CaseListResult; error?: string };

export function useCases(params: CaseListParams) {
    const key = JSON.stringify(params);
    const [result, setResult] = useState<Result | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchCases(JSON.parse(key) as CaseListParams, controller.signal)
            .then((data) => setResult({ key, data }))
            .catch((error: Error) => {
                if (!controller.signal.aborted) setResult({ key, error: error.message });
            });
        return () => controller.abort();
    }, [key]);

    return {
        data: result?.data,
        error: result?.key === key ? result.error : undefined,
        loading: result?.key !== key,
    };
}
