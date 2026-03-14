/**
 * useMutations - Custom hooks for API mutations
 * Dependency Inversion: Uses specialized APIs via context
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRunsApi, useImportApi, useComplianceReportApi } from '../providers';

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
export function useExecuteRun() {
    const runsApi = useRunsApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: ExecuteRunParams) => {
            const result = await runsApi.executeRun(params);
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
export function useImportHireData() {
    const importApi = useImportApi();
    return useMutation({
        mutationFn: (file: File) => importApi.importHireData(file),
    });
}

/**
 * useImportContractorSnapshots - Mutation hook for importing contractor snapshots
 */
export function useImportContractorSnapshots() {
    const importApi = useImportApi();
    return useMutation({
        mutationFn: (file: File) => importApi.importContractorSnapshots(file),
    });
}

/**
 * useUpdateComplianceReport - Mutation hook for updating compliance reports
 */
export function useUpdateComplianceReport() {
    const complianceReportApi = useComplianceReportApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { reportDetailId: number; updates: { status: string; notes?: string } }) =>
            complianceReportApi.updateComplianceReport(params.reportDetailId, params.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reportDetails'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });
}
