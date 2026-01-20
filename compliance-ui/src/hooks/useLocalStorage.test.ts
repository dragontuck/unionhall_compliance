import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('initialization', () => {
        it('should initialize with initial value when localStorage is empty', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

            const [value] = result.current;
            expect(value).toBe('initial-value');
        });

        it('should initialize with stored value from localStorage', () => {
            localStorage.setItem('test-key', JSON.stringify('stored-value'));

            const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

            const [value] = result.current;
            expect(value).toBe('stored-value');
        });

        it('should handle complex objects', () => {
            const initialObject = { id: 1, name: 'Test', nested: { key: 'value' } };

            const { result } = renderHook(() => useLocalStorage('test-key', initialObject));

            const [value] = result.current;
            expect(value).toEqual(initialObject);
        });

        it('should handle arrays', () => {
            const initialArray = [1, 2, 3];

            const { result } = renderHook(() => useLocalStorage('test-key', initialArray));

            const [value] = result.current;
            expect(value).toEqual(initialArray);
        });
    });

    describe('setValue', () => {
        it('should update state and localStorage', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

            const [, setValue] = result.current;

            act(() => {
                setValue('updated');
            });

            const [newValue] = result.current;
            expect(newValue).toBe('updated');
            expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
        });

        it('should handle updating complex objects', () => {
            const initial = { id: 1, name: 'Initial' };
            const { result } = renderHook(() => useLocalStorage('test-key', initial));

            const updated = { id: 2, name: 'Updated' };
            const [, setValue] = result.current;

            act(() => {
                setValue(updated);
            });

            const [value] = result.current;
            expect(value).toEqual(updated);
            expect(JSON.parse(localStorage.getItem('test-key') || '{}')).toEqual(updated);
        });

        it('should handle updating arrays', () => {
            const initial = [1, 2, 3];
            const { result } = renderHook(() => useLocalStorage('test-key', initial));

            const updated = [4, 5, 6];
            const [, setValue] = result.current;

            act(() => {
                setValue(updated);
            });

            const [value] = result.current;
            expect(value).toEqual(updated);
        });

        it('should handle null values', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

            const [, setValue] = result.current;

            act(() => {
                setValue(null as any);
            });

            const [value] = result.current;
            expect(value).toBeNull();
            expect(localStorage.getItem('test-key')).toBe(JSON.stringify(null));
        });
    });

    describe('error handling', () => {
        it('should fall back to initial value if localStorage is corrupted', () => {
            localStorage.setItem('test-key', 'invalid json {');

            const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

            const [value] = result.current;
            expect(value).toBe('fallback');
        });

        it('should handle localStorage quota exceeded', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

            const [, setValue] = result.current;

            // Mock window.localStorage.setItem to throw
            const originalSetItem = window.localStorage.setItem;
            window.localStorage.setItem = vi.fn(() => {
                throw new Error('QuotaExceededError');
            });

            // Spy on console.error
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                setValue('new-value');
            });

            // Verify the error was caught and logged to console
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save to localStorage: test-key');

            window.localStorage.setItem = originalSetItem;
            consoleErrorSpy.mockRestore();
        });

        it('should handle reading from localStorage that throws', () => {
            const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

            const [value] = result.current;
            expect(value).toBe('fallback');

            getItemSpy.mockRestore();
        });
    });

    describe('multiple keys', () => {
        it('should handle multiple independent keys', () => {
            const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
            const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

            const [value1] = result1.current;
            const [value2] = result2.current;

            expect(value1).toBe('value1');
            expect(value2).toBe('value2');

            const [, setValue1] = result1.current;

            act(() => {
                setValue1('updated1');
            });

            const [newValue1] = result1.current;
            const [value2After] = result2.current;

            expect(newValue1).toBe('updated1');
            expect(value2After).toBe('value2');
        });
    });
});
