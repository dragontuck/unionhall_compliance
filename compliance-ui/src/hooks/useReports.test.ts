import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReportsByRun } from './useReports';
import { createTestWrapper, createMockApiClient } from '../setupTestUtils';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useReports hooks', () => {
    let mockApiClient: Partial<IApiClient>;

    beforeEach(() => {
        mockApiClient = createMockApiClient();
    });

    describe('useReportsByRun', () => {
        it('should return undefined data initially when runId is null', () => {
            const { result } = renderHook(
                () => useReportsByRun(mockApiClient as IApiClient, null),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            // Query is disabled when runId is null, so data is undefined
            expect(result.current.data).toBeUndefined();
        });

        it('should fetch reports when runId is provided', async () => {
            const mockReports = [
                { id: 1, name: 'Report 1' },
                { id: 2, name: 'Report 2' },
            ];
            (mockApiClient.getReportsByRun as any).mockResolvedValue(mockReports);

            const { result } = renderHook(
                () => useReportsByRun(mockApiClient as IApiClient, 1),
                { wrapper: createTestWrapper(mockApiClient) }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });
});
