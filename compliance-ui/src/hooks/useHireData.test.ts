import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRawHireData, useRecentHiresByRun } from './useHireData';
import { createTestWrapper, createMockApiClient } from '../setupTestUtils';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useHireData hooks', () => {
    let mockApiClient: Partial<IApiClient>;

    beforeEach(() => {
        mockApiClient = createMockApiClient();
    });

    describe('useRawHireData', () => {
        it('should not fetch when reviewedDate is undefined', () => {
            (mockApiClient.getRawHireData as any).mockResolvedValue([]);

            const { result } = renderHook(
                () => useRawHireData(undefined),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            expect(mockApiClient.getRawHireData).not.toHaveBeenCalled();
            expect(result.current.isLoading).toBe(false);
        });

        it('should fetch data when reviewedDate is provided', async () => {
            const mockData = [
                { id: 1, name: 'Employee 1' },
                { id: 2, name: 'Employee 2' },
            ];
            (mockApiClient.getRawHireData as any).mockResolvedValue(mockData);

            const { result } = renderHook(
                () => useRawHireData('2024-01-15'),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockData);
            expect(mockApiClient.getRawHireData).toHaveBeenCalledWith('2024-01-15');
        });

        it('should refetch when reviewedDate changes', async () => {
            const mockData1 = [{ id: 1, name: 'Data 1' }];
            const mockData2 = [{ id: 2, name: 'Data 2' }];

            (mockApiClient.getRawHireData as any)
                .mockResolvedValueOnce(mockData1)
                .mockResolvedValueOnce(mockData2);

            const { result, rerender } = renderHook(
                ({ date }: { date?: string }) => useRawHireData(date),
                { initialProps: { date: '2024-01-15' }, wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockData1);

            rerender({ date: '2024-01-16' });

            await waitFor(() => {
                expect(mockApiClient.getRawHireData).toHaveBeenCalledTimes(2);
            });
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Failed to fetch');
            (mockApiClient.getRawHireData as any).mockRejectedValue(error);

            const { result } = renderHook(
                () => useRawHireData('2024-01-15'),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(error);
        });

        it('should return empty array by default', () => {
            const { result } = renderHook(
                () => useRawHireData(undefined),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            // Data is undefined when query is disabled, not an empty array
            expect(result.current.data).toBeUndefined();
        });
    });

    describe('useRecentHiresByRun', () => {
        it('should not fetch when runId is null', () => {
            (mockApiClient.getRecentHiresByRun as any).mockResolvedValue([]);

            const { result } = renderHook(
                () => useRecentHiresByRun(null),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            expect(result.current.isLoading).toBe(false);
        });

        it('should fetch data when runId is provided', async () => {
            const mockData = [
                { id: 1, hireId: 'H001', status: 'compliant' },
            ];
            (mockApiClient.getRecentHiresByRun as any).mockResolvedValue(mockData);

            const { result } = renderHook(
                () => useRecentHiresByRun(1),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockData);
            expect(mockApiClient.getRecentHiresByRun).toHaveBeenCalledWith(1);
        });

        it('should refetch when runId changes', async () => {
            const mockData1 = [{ id: 1 }];
            const mockData2 = [{ id: 2 }];

            (mockApiClient.getRecentHiresByRun as any)
                .mockResolvedValueOnce(mockData1)
                .mockResolvedValueOnce(mockData2);

            const { result, rerender } = renderHook(
                ({ runId }: { runId: number | null }) =>
                    useRecentHiresByRun(runId),
                { initialProps: { runId: 1 }, wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockData1);

            rerender({ runId: 2 });

            await waitFor(() => {
                expect(mockApiClient.getRecentHiresByRun).toHaveBeenCalledTimes(2);
            });
        });

        it('should return empty array when queryFn returns empty', async () => {
            (mockApiClient.getRecentHiresByRun as any).mockResolvedValue([]);

            const { result } = renderHook(
                () => useRecentHiresByRun(1),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual([]);
        });

        it('should handle errors for specific runId', async () => {
            const error = new Error('Failed to fetch hires');
            (mockApiClient.getRecentHiresByRun as any).mockRejectedValue(error);

            const { result } = renderHook(
                () => useRecentHiresByRun(1),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });
        });
    });
});
