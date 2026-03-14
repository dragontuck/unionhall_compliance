/**
 * useEditDialog - Generic hook for managing edit dialog state and handlers
 * Single Responsibility: Only manages edit dialog lifecycle
 * Reusable across features for updating existing records
 */

import { useState, useCallback } from 'react';

export interface UseEditDialogReturn<TRecord, TForm> {
    record: TRecord | null;
    formData: TForm | null;
    isSubmitting: boolean;
    openDialog: (record: TRecord, initialForm: TForm) => void;
    closeDialog: () => void;
    setFormData: (data: TForm) => void;
    setIsSubmitting: (state: boolean) => void;
}

export function useEditDialog<TRecord, TForm>(): UseEditDialogReturn<TRecord, TForm> {
    const [record, setRecord] = useState<TRecord | null>(null);
    const [formData, setFormData] = useState<TForm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDialog = useCallback((rec: TRecord, initialForm: TForm) => {
        setRecord(rec);
        setFormData(initialForm);
    }, []);

    const closeDialog = useCallback(() => {
        setRecord(null);
        setFormData(null);
    }, []);

    const handleSetFormData = useCallback((data: TForm) => {
        setFormData(data);
    }, []);

    const handleSetIsSubmitting = useCallback((state: boolean) => {
        setIsSubmitting(state);
    }, []);

    return {
        record,
        formData,
        isSubmitting,
        openDialog,
        closeDialog,
        setFormData: handleSetFormData,
        setIsSubmitting: handleSetIsSubmitting,
    };
}
