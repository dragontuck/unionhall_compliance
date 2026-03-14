/**
 * useAddDialog - Generic hook for managing add dialog state and handlers
 * Single Responsibility: Only manages add dialog lifecycle
 * Reusable across features for creating new records
 */

import { useState, useCallback } from 'react';

export interface UseAddDialogReturn<T> {
    isOpen: boolean;
    formData: T;
    isSubmitting: boolean;
    openDialog: () => void;
    closeDialog: () => void;
    setFormData: (data: T) => void;
    setIsSubmitting: (state: boolean) => void;
    resetForm: () => void;
}

export function useAddDialog<T>(initialData: T): UseAddDialogReturn<T> {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<T>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDialog = useCallback(() => {
        setIsOpen(true);
        setFormData(initialData);
    }, [initialData]);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        setFormData(initialData);
    }, [initialData]);

    const resetForm = useCallback(() => {
        setFormData(initialData);
    }, [initialData]);

    return {
        isOpen,
        formData,
        isSubmitting,
        openDialog,
        closeDialog,
        setFormData,
        setIsSubmitting,
        resetForm,
    };
}
