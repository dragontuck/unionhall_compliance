/**
 * useApiClient - Hook to access IApiClient from context
 * Single Responsibility Principle: Only provides access to API client
 */

import { useContext } from 'react';
import { ApiContext } from './ApiProvider';

export function useApiClient() {
    const apiClient = useContext(ApiContext);
    if (!apiClient) {
        throw new Error('useApiClient must be used within ApiProvider');
    }
    return apiClient;
}
