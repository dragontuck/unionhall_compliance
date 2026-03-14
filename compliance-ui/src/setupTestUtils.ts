/**
 * Test utilities for context-based DI
 * Provides helper functions for setting up test environments with mocked APIs
 */

import { createElement } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from './providers';
import type { IApiClient } from './services/interfaces/IApiClient';
import { vi } from 'vitest';

/**
 * Create a mock API client with all methods mocked
 */
export function createMockApiClient(): Partial<IApiClient> {
    return {
        // IRunsAPI
        getRuns: vi.fn(),
        getRunById: vi.fn(),
        executeRun: vi.fn(),

        // IImportAPI
        importHireData: vi.fn(),
        importContractorSnapshots: vi.fn(),

        // IReportsAPI
        getReports: vi.fn(),
        getReportsByRun: vi.fn(),

        // IReportDetailsAPI
        getReportDetails: vi.fn(),
        getReportDetailsByRun: vi.fn(),
        getLastHiresByRun: vi.fn(),
        getRecentHiresByRun: vi.fn(),
        getRunReport: vi.fn(),

        // IReportNotesAPI
        getReportNotesByReportId: vi.fn(),
        getReportNotesByEmployerId: vi.fn(),
        getNotesByEmployerId: vi.fn(),

        // IHireDataAPI
        getRawHireData: vi.fn(),

        // IModeAPI
        getModes: vi.fn(),

        // IExcelExportAPI
        exportRunToExcel: vi.fn(),
        getExcelExportData: vi.fn(),

        // IComplianceReportAPI
        updateComplianceReport: vi.fn(),
        deleteComplianceReport: vi.fn(),

        // IBlacklistAPI
        getBlacklist: vi.fn(),
        getBlacklistIncludingDeleted: vi.fn(),
        getBlacklistById: vi.fn(),
        getBlacklistByEmployerId: vi.fn(),
        createBlacklist: vi.fn(),
        updateBlacklist: vi.fn(),
        deleteBlacklist: vi.fn(),
    };
}

/**
 * Create a test wrapper with ApiProvider and QueryClientProvider
 * Provides context-based DI for all hooks
 */
export function createTestWrapper(mockApiClient?: Partial<IApiClient>) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    const apiClient = mockApiClient || createMockApiClient();

    return ({ children }: { children: ReactNode }) =>
        createElement(
            ApiProvider,
            {
                apiClient: apiClient as IApiClient,
                children: createElement(
                    QueryClientProvider,
                    { client: queryClient },
                    children
                ),
            }
        );
}

/**
 * Create a query client for tests
 */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

/**
 * Create a test wrapper with custom QueryClient and mock API client
 * Useful for testing cache behavior with a specific QueryClient instance
 */
export function createTestWrapperWithQueryClient(
    queryClient: QueryClient,
    mockApiClient?: Partial<IApiClient>
) {
    const apiClient = mockApiClient || createMockApiClient();

    return ({ children }: { children: ReactNode }) =>
        createElement(
            ApiProvider,
            {
                apiClient: apiClient as IApiClient,
                children: createElement(
                    QueryClientProvider,
                    { client: queryClient },
                    children
                ),
            }
        );
}
