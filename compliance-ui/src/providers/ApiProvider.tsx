/**
 * ApiContext - Provides IApiClient to entire application
 * Dependency Inversion Principle: Depends on abstraction, not concrete implementations
 */

import { createContext, ReactNode } from 'react';
import type { IApiClient } from '../services/interfaces/IApiClient';
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
