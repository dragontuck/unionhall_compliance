import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useReportsByRun, useReportDetailsByRun, useLastHiresByRun } from './useReports';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useReports hooks', () => {
    let mockApiService: Partial<IApiClient>;

    beforeEach(() => {
        mockApiService = {
            getReportsByRun: vi.fn(),
            getReportDetailsByRun: vi.fn(),
            getLastHiresByRun: vi.fn(),
        };
    });

    const createWrapper = () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        const Wrapper = ({ children }: { children: ReactNode }) => {
            const createElement = require('react').createElement;
            return createElement(QueryClientProvider, { client: queryClient }, children);
        };
        return Wrapper;
    };

    describe('useReportsByRun', () => {
        it('should return undefined data initially when runId is null', () => {
            const { result } = renderHook(
                () => useReportsByRun(mockApiService as IApiClient, null),
                { wrapper: createWrapper() }
            );

            // Query is disabled when runId is null, so data is undefined
            expect(result.current.data).toBeUndefined();
        });

        it('should fetch reports when runId is provided', async () => {
            const mockReports = [
                { id: 1, name: 'Report 1' },
                { id: 2, name: 'Report 2' },
            ];
            (mockApiService.getReportsByRun as any).mockResolvedValue(mockReports);

            const { result } = renderHook(
                () => useReportsByRun(mockApiService as IApiClient, 1),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });
});
