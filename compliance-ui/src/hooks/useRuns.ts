/**
 * useRuns - Hook for managing compliance runs
 * Single Responsibility Principle: Only handles run-related queries
 */

import { useQuery } from '@tanstack/react-query';
import type { ComplianceRun } from '../../types';
import type { IApiClient } from '../../services/interfaces/IApiClient';

export function useRuns(apiClient: IApiClient) {
    return useQuery({
        queryKey: ['runs'],
        queryFn: () => apiClient.getRuns(),
    });
}

/**
 * useRunById - Hook for fetching a specific run
 */
export function useRunById(
    apiClient: IApiClient,
    runId: number | null
) {
    return useQuery({
        queryKey: ['run', runId],
        queryFn: () => {
            if (!runId) return null;
            return apiClient.getRunById(runId);
        },
        enabled: !!runId,
    });
}
