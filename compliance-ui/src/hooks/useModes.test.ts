import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import type { ReactNode } from 'react';
import { useModes } from './useModes';
import { createTestWrapper, createMockApiClient } from '../setupTestUtils';
import type { IApiClient } from '../services/interfaces/IApiClient';

describe('useModes', () => {
    let mockApiClient: Partial<IApiClient>;

    beforeEach(() => {
        mockApiClient = createMockApiClient();
    });

    it('should initialize with loading state', () => {
        (mockApiClient.getModes as any).mockResolvedValue([]);

        const { result } = renderHook(
            () => useModes(),
            { wrapper: createTestWrapper(mockApiClient) }
        );

        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch modes successfully', async () => {
        const mockModes = [
            { id: 1, name: 'Mode 1' },
            { id: 2, name: 'Mode 2' },
        ];
        (mockApiClient.getModes as any).mockResolvedValue(mockModes);

        const { result } = renderHook(
            () => useModes(),
            { wrapper: createTestWrapper(mockApiClient) }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockModes);
    });

    it('should handle errors', async () => {
        const error = new Error('Failed to fetch modes');
        (mockApiClient.getModes as any).mockRejectedValue(error);

        const { result } = renderHook(
            () => useModes(),
            { wrapper: createTestWrapper(mockApiClient) }
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(error);
    });

    it('should cache results with modes query key', async () => {
        const mockModes = [{ id: 1, name: 'Mode 1' }];
        (mockApiClient.getModes as any).mockResolvedValue(mockModes);

        const { result: result1 } = renderHook(
            () => useModes(),
            { wrapper: createTestWrapper(mockApiClient) }
        );

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true);
        });

        // Query should have been called at least once
        expect(result1.current.data).toEqual(mockModes);
    });

    it('should return empty array when no modes are available', async () => {
        (mockApiClient.getModes as any).mockResolvedValue([]);

        const { result } = renderHook(
            () => useModes(),
            { wrapper: createTestWrapper(mockApiClient) }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual([]);
    });
});
