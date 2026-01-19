/**
 * API Service - Factory and singleton instance
 * Provides dependency injection for API client
 * Dependency Inversion Principle: Depend on IApiClient interface
 */

import type { IApiClient } from './interfaces/IApiClient';
import { AxiosApiClient } from './implementations/AxiosApiClient';

// Factory function for creating API client
export function createApiClient(baseURL?: string): IApiClient {
    return new AxiosApiClient(baseURL);
}

// Singleton instance for default use
export const apiService = createApiClient();
