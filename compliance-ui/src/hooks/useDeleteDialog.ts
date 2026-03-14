/**
 * useDeleteDialog - Generic hook for managing delete confirmation dialog state
 * Single Responsibility: Only manages delete confirmation lifecycle
 * Reusable across features for record deletion confirmations
 */

import { useState, useCallback } from 'react';

export interface UseDeleteDialogReturn<T> {
    record: T | null;
    isSubmitting: boolean;
    openDialog: (record: T) => void;
    closeDialog: () => void;
    setIsSubmitting: (state: boolean) => void;
}

export function useDeleteDialog<T>(): UseDeleteDialogReturn<T> {
    const [record, setRecord] = useState<T | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDialog = useCallback((rec: T) => {
        setRecord(rec);
    }, []);

    const closeDialog = useCallback(() => {
        setRecord(null);
    }, []);

    const handleSetIsSubmitting = useCallback((state: boolean) => {
        setIsSubmitting(state);
    }, []);

    return {
        record,
        isSubmitting,
        openDialog,
        closeDialog,
        setIsSubmitting: handleSetIsSubmitting,
    };
}
