import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from './useDragAndDrop';

describe('useDragAndDrop', () => {
    describe('initialization', () => {
        it('should initialize with dragActive as false', () => {
            const { result } = renderHook(() => useDragAndDrop());

            expect(result.current.dragActive).toBe(false);
        });
    });

    describe('handleDrag', () => {
        it('should set dragActive to true on dragenter', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dragEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            });

            act(() => {
                result.current.handleDrag(dragEvent as any);
            });

            expect(result.current.dragActive).toBe(true);
        });

        it('should set dragActive to true on dragover', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dragEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
            });

            act(() => {
                result.current.handleDrag(dragEvent as any);
            });

            expect(result.current.dragActive).toBe(true);
        });

        it('should set dragActive to false on dragleave', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dragEnterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            });

            act(() => {
                result.current.handleDrag(dragEnterEvent as any);
            });

            expect(result.current.dragActive).toBe(true);

            const dragLeaveEvent = new DragEvent('dragleave', {
                bubbles: true,
                cancelable: true,
            });

            act(() => {
                result.current.handleDrag(dragLeaveEvent as any);
            });

            expect(result.current.dragActive).toBe(false);
        });

        it('should prevent default behavior', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dragEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            });

            const preventDefaultSpy = vi.spyOn(dragEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(dragEvent, 'stopPropagation');

            act(() => {
                result.current.handleDrag(dragEvent as any);
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });

    describe('handleDrop', () => {
        it('should call onDrop callback with files', () => {
            const { result } = renderHook(() => useDragAndDrop());
            const onDropMock = vi.fn();

            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            const fileList = {
                0: file,
                length: 1,
                item: (index: number) => (index === 0 ? file : null),
            } as FileList;

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: fileList },
            });

            act(() => {
                result.current.handleDrop(dropEvent as any, onDropMock);
            });

            expect(onDropMock).toHaveBeenCalledWith(fileList);
        });

        it('should set dragActive to false on drop', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dragEnterEvent = new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
            });

            act(() => {
                result.current.handleDrag(dragEnterEvent as any);
            });

            expect(result.current.dragActive).toBe(true);

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: [] },
            });

            act(() => {
                result.current.handleDrop(dropEvent as any, vi.fn());
            });

            expect(result.current.dragActive).toBe(false);
        });

        it('should prevent default behavior on drop', () => {
            const { result } = renderHook(() => useDragAndDrop());

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: [] },
            });

            const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(dropEvent, 'stopPropagation');

            act(() => {
                result.current.handleDrop(dropEvent as any, vi.fn());
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it('should handle drop with no files gracefully', () => {
            const { result } = renderHook(() => useDragAndDrop());
            const onDropMock = vi.fn();

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: null },
            });

            act(() => {
                result.current.handleDrop(dropEvent as any, onDropMock);
            });

            expect(onDropMock).not.toHaveBeenCalled();
        });
    });
});
