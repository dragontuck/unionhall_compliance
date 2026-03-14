import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileInfo } from './FileInfo';

describe('FileInfo Component', () => {
    it('should render file info', () => {
        render(
            <FileInfo fileName="test.csv" isLoading={false} onImport={() => { }} />
        );

        expect(screen.getByText(/test.csv/)).toBeInTheDocument();
    });

    it('should display file name', () => {
        render(
            <FileInfo fileName="data.csv" isLoading={false} onImport={() => { }} />
        );

        expect(screen.getByText(/data.csv/)).toBeInTheDocument();
    });

    it('should render import button', () => {
        render(
            <FileInfo fileName="test.csv" isLoading={false} onImport={() => { }} />
        );

        const button = screen.getByRole('button', { name: /import/i });
        expect(button).toBeInTheDocument();
    });

    it('should call onImport when button is clicked', async () => {
        const user = userEvent.setup();
        const mockOnImport = vi.fn();

        render(
            <FileInfo fileName="test.csv" isLoading={false} onImport={mockOnImport} />
        );

        const button = screen.getByRole('button', { name: /import/i });
        await user.click(button);

        expect(mockOnImport).toHaveBeenCalled();
    });

    it('should disable button when loading', () => {
        render(
            <FileInfo fileName="test.csv" isLoading={true} onImport={() => { }} />
        );

        const button = screen.getByRole('button', { name: /import/i });
        expect(button).toBeDisabled();
    });
});
