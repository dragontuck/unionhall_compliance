import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

describe('useAsync', () => {
    describe('initialization', () => {
        it('should initialize with default state when immediate is true', () => {
            const asyncFn = vi.fn().mockResolvedValue('test data');

            const { result } = renderHook(() => useAsync(asyncFn, true));

            expect(result.current.loading).toBe(true);
            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it('should initialize without loading when immediate is false', () => {
            const asyncFn = vi.fn();

            const { result } = renderHook(() => useAsync(asyncFn, false));

            expect(result.current.loading).toBe(false);
            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
        });
    });

    describe('successful execution', () => {
        it('should load data successfully when immediate is true', async () => {
            const mockData = { id: 1, name: 'Test' };
            const asyncFn = vi.fn().mockResolvedValue(mockData);

            const { result } = renderHook(() => useAsync(asyncFn, true));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData);
            expect(result.current.error).toBeNull();
        });

        it('should load data when execute is called manually', async () => {
            const mockData = { id: 1, name: 'Test' };
            const asyncFn = vi.fn().mockResolvedValue(mockData);

            const { result } = renderHook(() => useAsync(asyncFn, false));

            expect(result.current.data).toBeNull();

            await waitFor(() => {
                result.current.execute();
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData);
        });
    });

    describe('error handling', () => {
        it('should handle errors properly', async () => {
            const error = new Error('Test error');
            const asyncFn = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() => useAsync(asyncFn, true));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toEqual(error);
        });

        it('should convert non-Error exceptions to Error objects', async () => {
            const asyncFn = vi.fn().mockRejectedValue('String error');

            const { result } = renderHook(() => useAsync(asyncFn, true));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toEqual(new Error('Unknown error'));
        });
    });

    describe('execute function', () => {
        it('should reset state when execute is called', async () => {
            const mockData = { id: 1 };
            const asyncFn = vi.fn().mockResolvedValue(mockData);

            const { result } = renderHook(() => useAsync(asyncFn, true));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData);

            // Call execute again
            asyncFn.mockResolvedValue({ id: 2 });
            result.current.execute();

            await waitFor(() => {
                expect(result.current.data).toEqual({ id: 2 });
            });
        });

        it('should handle multiple sequential executions', async () => {
            const asyncFn = vi.fn()
                .mockResolvedValueOnce('first')
                .mockResolvedValueOnce('second');

            const { result } = renderHook(() => useAsync(asyncFn, false));

            await result.current.execute();
            await waitFor(() => {
                expect(result.current.data).toBe('first');
            });

            await result.current.execute();
            await waitFor(() => {
                expect(result.current.data).toBe('second');
            });
        });
    });

    describe('dependency updates', () => {
        it('should re-execute when async function reference changes', async () => {
            const firstFn = vi.fn().mockResolvedValue('first');
            let asyncFn = firstFn;

            const { result, rerender } = renderHook(
                ({ fn, immediate }: { fn: () => Promise<string>; immediate: boolean }) =>
                    useAsync(fn, immediate),
                { initialProps: { fn: asyncFn, immediate: true } }
            );

            await waitFor(() => {
                expect(result.current.data).toBe('first');
            });

            const secondFn = vi.fn().mockResolvedValue('second');
            asyncFn = secondFn;
            rerender({ fn: asyncFn, immediate: true });

            await waitFor(() => {
                expect(result.current.data).toBe('second');
            });
        });
    });
});
