/**
 * useReports - Hook for managing compliance reports
 * Single Responsibility Principle: Only handles report-related queries
 */

import { useQuery } from '@tanstack/react-query';
import type { ComplianceReport, ComplianceReportDetail } from '../../types';
import type { IApiClient } from '../../services/interfaces/IApiClient';

export function useReportsByRun(
    apiClient: IApiClient,
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
    apiClient: IApiClient,
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
    apiClient: IApiClient,
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
