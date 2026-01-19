/**
 * useLocalStorage - Hook for persisting state to local storage
 * Single Responsibility Principle: Only manages local storage
 */

import { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T) => {
            try {
                setStoredValue(value);
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch {
                console.error(`Failed to save to localStorage: ${key}`);
            }
        },
        [key]
    );

    return [storedValue, setValue];
}
