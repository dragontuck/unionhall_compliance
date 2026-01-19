/**
 * useDragAndDrop - Hook for drag and drop functionality
 * Single Responsibility Principle: Only manages drag/drop state
 */

import { useState, useCallback } from 'react';

export function useDragAndDrop() {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, onDrop: (files: FileList) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            onDrop(e.dataTransfer.files);
        }
    }, []);

    return {
        dragActive,
        handleDrag,
        handleDrop,
    };
}
