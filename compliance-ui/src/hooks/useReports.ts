/**
 * useReports - Hooks for managing compliance reports
 * Single Responsibility Principle: Only handles report-related queries
 * Interface Segregation Principle: Depends only on needed API interfaces
 */

import { useQuery } from '@tanstack/react-query';
import type { IReportsAPI, IReportDetailsAPI } from '../services/interfaces';

export function useReportsByRun(
    apiClient: IReportsAPI,
    runId: number | null
) {
    return useQuery({
        queryKey: ['reports', runId],
        queryFn: () => {
            if (!runId) return [];
            return apiClient.getReportsByRun(runId);
        },
        enabled: !!runId,
    });
}

export function useReportDetailsByRun(
    apiClient: IReportDetailsAPI,
    runId: number | null
) {
    return useQuery({
        queryKey: ['reportDetails', runId],
        queryFn: () => {
            if (!runId) return [];
            return apiClient.getReportDetailsByRun(runId);
        },
        enabled: !!runId,
    });
}

export function useLastHiresByRun(
    apiClient: IReportDetailsAPI,
    runId: number | null
) {
    return useQuery({
        queryKey: ['lastHires', runId],
        queryFn: () => {
            if (!runId) return [];
            return apiClient.getLastHiresByRun(runId);
        },
        enabled: !!runId,
    });
}
