/**
 * useHireData - Hooks for managing hire data
 * Dependency Inversion: Uses specialized IHireDataAPI and IReportDetailsAPI via context
 */

import { useQuery } from '@tanstack/react-query';
import { useHireDataApi, useReportDetailsApi } from '../providers';

export function useRawHireData(reviewedDate?: string) {
    const hireDataApi = useHireDataApi();
    return useQuery({
        queryKey: ['rawHireData', reviewedDate],
        queryFn: () => hireDataApi.getRawHireData(reviewedDate),
        enabled: !!reviewedDate,
    });
}

export function useRecentHiresByRun(runId: number | null) {
    const reportDetailsApi = useReportDetailsApi();
    return useQuery({
        queryKey: ['recentHires', runId],
        queryFn: () => {
            if (!runId) return [];
            return reportDetailsApi.getRecentHiresByRun(runId);
        },
        enabled: !!runId,
    });
}
