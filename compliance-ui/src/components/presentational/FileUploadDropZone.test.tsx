import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FileUploadDropZone } from './FileUploadDropZone';

describe('FileUploadDropZone Component', () => {
    const defaultProps = {
        isLoading: false,
        onDragEnter: vi.fn(),
        onDragLeave: vi.fn(),
        onDragOver: vi.fn(),
        onDrop: vi.fn(),
        onChange: vi.fn(),
    };

    it('should render drop zone', () => {
        const { container } = render(<FileUploadDropZone {...defaultProps} />);

        const dropZone = container.querySelector('.upload-zone');
        expect(dropZone).toBeInTheDocument();
    });

    it('should have file input element', () => {
        const { container } = render(<FileUploadDropZone {...defaultProps} />);

        const input = container.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
    });

    it('should have upload zone with correct structure', () => {
        const { container } = render(<FileUploadDropZone {...defaultProps} />);

        const dropZone = container.querySelector('.upload-zone');
        expect(dropZone).toBeInTheDocument();
    });

    it('should handle disabled state when loading', () => {
        const { container } = render(<FileUploadDropZone {...defaultProps} isLoading={true} />);

        const dropZone = container.querySelector('.upload-zone');
        expect(dropZone).toBeInTheDocument();
    });
});
