/**
 * useRuns - Hooks for managing compliance runs
 * Dependency Inversion: Uses specialized IRunsAPI via context
 */

import { useQuery } from '@tanstack/react-query';
import { useRunsApi } from '../providers';

export function useRuns() {
    const runsApi = useRunsApi();
    return useQuery({
        queryKey: ['runs'],
        queryFn: () => runsApi.getRuns(),
    });
}

/**
 * useRunById - Hook for fetching a specific run
 */
export function useRunById(runId: number | null) {
    const runsApi = useRunsApi();
    return useQuery({
        queryKey: ['run', runId],
        queryFn: () => {
            if (!runId) return null;
            return runsApi.getRunById(runId);
        },
        enabled: !!runId,
    });
}
