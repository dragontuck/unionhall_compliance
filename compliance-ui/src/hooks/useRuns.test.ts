import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRuns, useRunById } from './useRuns';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useRuns hooks', () => {
    let mockApiService: Partial<IApiClient>;

    beforeEach(() => {
        mockApiService = {
            getRuns: vi.fn(),
            getRunById: vi.fn(),
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

    describe('useRuns', () => {
        it('should initialize with loading state', () => {
            (mockApiService.getRuns as any).mockResolvedValue([]);

            const { result } = renderHook(
                () => useRuns(mockApiService as IApiClient),
                { wrapper: createWrapper() }
            );

            expect(result.current.isLoading).toBe(true);
        });

        it('should fetch runs on mount', async () => {
            const mockRuns = [
                { id: 1, name: 'Run 1', status: 'completed' },
                { id: 2, name: 'Run 2', status: 'running' },
            ];
            (mockApiService.getRuns as any).mockResolvedValue(mockRuns);

            const { result } = renderHook(
                () => useRuns(mockApiService as IApiClient),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });

    describe('useRunById', () => {
        it('should not fetch when runId is null', () => {
            const { result } = renderHook(
                () => useRunById(mockApiService as IApiClient, null),
                { wrapper: createWrapper() }
            );

            expect(result.current.data).toBeUndefined();
            expect(mockApiService.getRunById).not.toHaveBeenCalled();
        });

        it('should fetch run by id when runId is provided', async () => {
            const mockRun = { id: 1, name: 'Run 1', status: 'completed' };
            (mockApiService.getRunById as any).mockResolvedValue(mockRun);

            const { result } = renderHook(
                () => useRunById(mockApiService as IApiClient, 1),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });
});
