/**
 * usePrevious - Hook for tracking previous value
 * Single Responsibility Principle: Only tracks value history
 */

import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}
