/**
 * useAlert - Hook for managing alert state
 * Single Responsibility Principle: Only handles alert logic
 */

import { useState, useCallback } from 'react';

export interface AlertMessage {
    type: 'success' | 'error';
    message: string;
}

export function useAlert(autoDismissTime: number = 3000) {
    const [alert, setAlert] = useState<AlertMessage | null>(null);
    const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null);

    const showAlert = useCallback(
        (type: 'success' | 'error', message: string) => {
            if (dismissTimer) clearTimeout(dismissTimer);

            setAlert({ type, message });

            const timer = setTimeout(() => {
                setAlert(null);
            }, autoDismissTime);

            setDismissTimer(timer);
        },
        [autoDismissTime, dismissTimer]
    );

    const clearAlert = useCallback(() => {
        setAlert(null);
        if (dismissTimer) clearTimeout(dismissTimer);
    }, [dismissTimer]);

    return {
        alert,
        showAlert,
        clearAlert,
    };
}
