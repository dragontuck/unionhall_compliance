import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRuns, useRunById } from './useRuns';
import { createTestWrapper, createMockApiClient } from '../setupTestUtils';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useRuns hooks', () => {
    let mockApiClient: Partial<IApiClient>;

    beforeEach(() => {
        mockApiClient = createMockApiClient();
    });

    describe('useRuns', () => {
        it('should initialize with loading state', () => {
            (mockApiClient.getRuns as any).mockResolvedValue([]);

            const { result } = renderHook(
                () => useRuns(),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            expect(result.current.isLoading).toBe(true);
        });

        it('should fetch runs on mount', async () => {
            const mockRuns = [
                { id: 1, name: 'Run 1', status: 'completed' },
                { id: 2, name: 'Run 2', status: 'running' },
            ];
            (mockApiClient.getRuns as any).mockResolvedValue(mockRuns);

            const { result } = renderHook(
                () => useRuns(),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });

    describe('useRunById', () => {
        it('should not fetch when runId is null', () => {
            const { result } = renderHook(
                () => useRunById(null),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            expect(result.current.data).toBeUndefined();
            expect(mockApiClient.getRunById).not.toHaveBeenCalled();
        });

        it('should fetch run by id when runId is provided', async () => {
            const mockRun = { id: 1, name: 'Run 1', status: 'completed' };
            (mockApiClient.getRunById as any).mockResolvedValue(mockRun);

            const { result } = renderHook(
                () => useRunById(1),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });
});
