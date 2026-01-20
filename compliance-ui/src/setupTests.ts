import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
});

// Mock DragEvent and DataTransfer
class DataTransferMock {
    items = [];
    files = [];
    effectAllowed = 'copy';
    dropEffect = 'none';

    setData() { }
    getData() { }
    clearData() { }
    setDragImage() { }
}

class DragEventMock extends MouseEvent {
    dataTransfer: DataTransferMock;

    constructor(type: string, eventInit?: any) {
        super(type, eventInit);
        this.dataTransfer = new DataTransferMock();
        Object.defineProperty(this, 'dataTransfer', {
            value: this.dataTransfer,
            writable: false,
        });
    }
}

if (!globalThis.DragEvent) {
    (globalThis as any).DragEvent = DragEventMock;
}

if (!globalThis.DataTransfer) {
    (globalThis as any).DataTransfer = DataTransferMock;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
});
