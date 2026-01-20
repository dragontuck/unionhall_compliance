import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAlert } from './useAlert';

describe('useAlert', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    describe('initialization', () => {
        it('should initialize with null alert', () => {
            const { result } = renderHook(() => useAlert());

            expect(result.current.alert).toBeNull();
        });

        it('should accept custom autoDismissTime', () => {
            const { result } = renderHook(() => useAlert(5000));

            expect(result.current.alert).toBeNull();
        });
    });

    describe('showAlert', () => {
        it('should display success alert', () => {
            const { result } = renderHook(() => useAlert());

            act(() => {
                result.current.showAlert('success', 'Operation successful');
            });

            expect(result.current.alert).toEqual({
                type: 'success',
                message: 'Operation successful',
            });
        });

        it('should display error alert', () => {
            const { result } = renderHook(() => useAlert());

            act(() => {
                result.current.showAlert('error', 'An error occurred');
            });

            expect(result.current.alert).toEqual({
                type: 'error',
                message: 'An error occurred',
            });
        });

        it('should auto-dismiss alert after timeout', () => {
            const { result } = renderHook(() => useAlert(3000));

            act(() => {
                result.current.showAlert('success', 'Test message');
            });

            expect(result.current.alert).not.toBeNull();

            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.alert).toBeNull();
        });

        it('should replace existing alert with new one', () => {
            const { result } = renderHook(() => useAlert());

            act(() => {
                result.current.showAlert('success', 'First message');
            });

            expect(result.current.alert?.message).toBe('First message');

            act(() => {
                result.current.showAlert('error', 'Second message');
            });

            expect(result.current.alert?.message).toBe('Second message');
            expect(result.current.alert?.type).toBe('error');
        });

        it('should reset timer when new alert is shown', () => {
            const { result } = renderHook(() => useAlert(3000));

            act(() => {
                result.current.showAlert('success', 'First');
            });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            act(() => {
                result.current.showAlert('success', 'Second');
            });

            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.alert).not.toBeNull();

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.alert).toBeNull();
        });
    });

    describe('clearAlert', () => {
        it('should immediately clear alert', () => {
            const { result } = renderHook(() => useAlert());

            act(() => {
                result.current.showAlert('success', 'Test');
            });

            expect(result.current.alert).not.toBeNull();

            act(() => {
                result.current.clearAlert();
            });

            expect(result.current.alert).toBeNull();
        });

        it('should clear pending timeout when alert is cleared', () => {
            const { result } = renderHook(() => useAlert(3000));

            act(() => {
                result.current.showAlert('success', 'Test');
            });

            act(() => {
                result.current.clearAlert();
            });

            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.alert).toBeNull();
        });

        it('should handle clearing when no alert is shown', () => {
            const { result } = renderHook(() => useAlert());

            expect(() => {
                act(() => {
                    result.current.clearAlert();
                });
            }).not.toThrow();

            expect(result.current.alert).toBeNull();
        });
    });

    describe('custom dismiss times', () => {
        it('should use custom autoDismissTime', () => {
            const { result } = renderHook(() => useAlert(5000));

            act(() => {
                result.current.showAlert('success', 'Test');
            });

            act(() => {
                vi.advanceTimersByTime(4000);
            });

            expect(result.current.alert).not.toBeNull();

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.alert).toBeNull();
        });
    });
});
