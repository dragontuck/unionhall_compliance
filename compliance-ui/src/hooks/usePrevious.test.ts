import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
    it('should return undefined on first render', () => {
        const { result } = renderHook(() => usePrevious('initial'));

        expect(result.current).toBeUndefined();
    });

    it('should return previous value on subsequent renders', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => usePrevious(value),
            { initialProps: { value: 'first' } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: 'second' });

        expect(result.current).toBe('first');
    });

    it('should track value changes through multiple renders', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: number }) => usePrevious(value),
            { initialProps: { value: 1 } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: 2 });
        expect(result.current).toBe(1);

        rerender({ value: 3 });
        expect(result.current).toBe(2);

        rerender({ value: 4 });
        expect(result.current).toBe(3);
    });

    it('should work with objects', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };

        const { result, rerender } = renderHook(
            ({ value }: { value: any }) => usePrevious(value),
            { initialProps: { value: obj1 } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: obj2 });

        expect(result.current).toBe(obj1);
    });

    it('should work with null values', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: any }) => usePrevious(value),
            { initialProps: { value: null } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: 'something' });
        expect(result.current).toBeNull();

        rerender({ value: null });
        expect(result.current).toBe('something');
    });

    it('should work with undefined values', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: any }) => usePrevious(value),
            { initialProps: { value: undefined } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: 'something' });
        expect(result.current).toBeUndefined();

        rerender({ value: undefined });
        expect(result.current).toBe('something');
    });

    it('should work with arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [4, 5, 6];

        const { result, rerender } = renderHook(
            ({ value }: { value: any[] }) => usePrevious(value),
            { initialProps: { value: arr1 } }
        );

        expect(result.current).toBeUndefined();

        rerender({ value: arr2 });

        expect(result.current).toBe(arr1);
        expect(result.current).toEqual([1, 2, 3]);
    });
});
