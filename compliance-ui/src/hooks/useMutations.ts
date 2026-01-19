/**
 * useMutations - Custom hooks for API mutations
 * Single Responsibility Principle: Encapsulates mutation logic
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ComplianceRun } from '../../types';
import type { IApiClient } from '../../services/interfaces/IApiClient';

export interface ExecuteRunParams {
    reviewedDate: string;
    mode: string;
    dryRun?: boolean;
}

export interface ExecuteRunResponse {
    message: string;
    runId: number;
    output?: string;
    dryRun?: boolean;
}

/**
 * useExecuteRun - Mutation hook for executing compliance runs
 */
export function useExecuteRun(apiClient: IApiClient) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: ExecuteRunParams) => {
            const result = await apiClient.executeRun(params);
            return {
                message: `Run executed successfully${params.dryRun ? ' (dry run)' : ''}! Reviewed Date: ${params.reviewedDate}`,
                runId: result.id,
                output: '',
                dryRun: params.dryRun,
            };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['runs'] });
        },
    });
}

/**
 * useImportHireData - Mutation hook for importing hire data
 */
export function useImportHireData(apiClient: IApiClient) {
    return useMutation({
        mutationFn: (file: File) => apiClient.importHireData(file),
    });
}

/**
 * useUpdateComplianceReport - Mutation hook for updating compliance reports
 */
export function useUpdateComplianceReport(apiClient: IApiClient) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportDetailId, updates }) =>
            apiClient.updateComplianceReport(reportDetailId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reportDetails'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });
}
