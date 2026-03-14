/**
 * useModes - Hook for managing compliance modes
 * Dependency Inversion: Uses specialized IModeAPI via context
 */

import { useQuery } from '@tanstack/react-query';
import { useModeApi } from '../providers';

export function useModes() {
    const modeApi = useModeApi();
    return useQuery({
        queryKey: ['modes'],
        queryFn: () => modeApi.getModes(),
    });
}
