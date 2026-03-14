/**
 * ApiProvider - Context provider for API client
 * Provides full IApiClient or any segregated interface through specialized hooks
 * Allows dependency injection of API client for testing and flexibility
 * Interface Segregation Principle: Clients can depend on specific interfaces via useSpecializedApi
 */

import { createContext, type ReactNode } from 'react';
import type { IApiClient } from '../services/interfaces';
import { AxiosApiClient } from '../services/implementations/AxiosApiClient';

export const ApiContext = createContext<IApiClient | undefined>(undefined);

export interface ApiProviderProps {
    children: ReactNode;
    apiClient?: IApiClient;
}

/**
 * ApiProvider - Context provider for API client
 * Allows dependency injection of API client for testing and flexibility
 */
export function ApiProvider({ children, apiClient }: ApiProviderProps) {
    const client = apiClient || new AxiosApiClient();

    return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}
