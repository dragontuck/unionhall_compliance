/**
 * useHireData - Hook for managing hire data
 * Single Responsibility Principle: Only handles hire-related queries
 */

import { useQuery } from '@tanstack/react-query';
import type { HireData, RecentHireData } from '../../types';
import type { IApiClient } from '../../services/interfaces/IApiClient';

export function useRawHireData(
    apiClient: IApiClient,
    reviewedDate?: string
) {
    return useQuery({
        queryKey: ['rawHireData', reviewedDate],
        queryFn: () => apiClient.getRawHireData(reviewedDate),
        enabled: !!reviewedDate,
    });
}

export function useRecentHiresByRun(
    apiClient: IApiClient,
    runId: number | null
) {
    return useQuery({
        queryKey: ['recentHires', runId],
        queryFn: () => {
            if (!runId) return [];
            return apiClient.getRecentHiresByRun(runId);
        },
        enabled: !!runId,
    });
}
