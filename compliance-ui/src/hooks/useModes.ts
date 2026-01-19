/**
 * useModes - Hook for managing compliance modes
 * Single Responsibility Principle: Only handles mode-related queries
 */

import { useQuery } from '@tanstack/react-query';
import type { Mode } from '../../types';
import type { IApiClient } from '../../services/interfaces/IApiClient';

export function useModes(apiClient: IApiClient) {
    return useQuery({
        queryKey: ['modes'],
        queryFn: () => apiClient.getModes(),
    });
}
