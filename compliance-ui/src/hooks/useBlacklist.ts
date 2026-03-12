/**
 * useBlacklist - Custom hook for blacklist data management
 * Uses React Query for caching and synchronization
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ContractorBlacklist } from '../types';

export function useBlacklist(includeDeleted: boolean = false) {
    const queryClient = useQueryClient();

    // Fetch blacklist data
    const { data: blacklist = [], isLoading, error } = useQuery<ContractorBlacklist[]>({
        queryKey: ['blacklist', includeDeleted],
        queryFn: () =>
            includeDeleted
                ? apiService.getBlacklistIncludingDeleted()
                : apiService.getBlacklist(),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: { employerId: string; contractorName: string }) =>
            apiService.createBlacklist(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { contractorName: string } }) =>
            apiService.updateBlacklist(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiService.deleteBlacklist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blacklist'] });
        },
    });

    return {
        blacklist,
        isLoading,
        error,
        createBlacklist: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        createError: createMutation.error,
        updateBlacklist: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,
        deleteBlacklist: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        deleteError: deleteMutation.error,
    };
}
