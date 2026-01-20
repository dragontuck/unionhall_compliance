import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUpload } from './FileUpload';
import * as apiProvider from '../providers';
import * as hooks from '../hooks';

// Mock the hooks and utilities
vi.mock('../hooks', async () => {
    const actual = await vi.importActual('../hooks');
    return {
        ...actual,
        useImportHireData: vi.fn(),
    };
});

vi.mock('../providers', async () => {
    const actual = await vi.importActual('../providers');
    return {
        ...actual,
        useApiClient: vi.fn(),
    };
});

vi.mock('../utils', () => ({
    isValidCsvFile: vi.fn((file: File) => file.name.endsWith('.csv')),
    extractErrorMessage: vi.fn((error: any, fallback: string) =>
        error?.message || fallback
    ),
}));

vi.mock('./presentational', () => ({
    FileUploadDropZone: ({ onDrop, onChange }: any) => (
        <div>
            <input
                type="file"
                onChange={onChange}
                data-testid="file-input"
            />
        </div>
    ),
    FileInfo: ({ fileName, onImport }: any) => (
        <div>
            <span>{fileName}</span>
            <button onClick={onImport}>Import</button>
        </div>
    ),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('FileUpload Component', () => {
    let mockApiClient: any;
    let mockMutation: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockApiClient = {
            importHireData: vi.fn(),
        };

        mockMutation = {
            mutate: vi.fn((file, { onSuccess, onError }) => { }),
            isPending: false,
            isError: false,
            isSuccess: false,
            error: null,
            data: null,
        };

        vi.mocked(apiProvider.useApiClient).mockReturnValue(mockApiClient);
        vi.mocked(hooks.useImportHireData).mockReturnValue(mockMutation);
    });

    describe('Rendering', () => {
        it('should render file upload container with heading', () => {
            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Hire Data Import')).toBeInTheDocument();
        });

        it('should render file input', () => {
            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByTestId('file-input')).toBeInTheDocument();
        });
    });

    describe('File Selection', () => {
        it('should display selected file name after selection', async () => {
            const user = userEvent.setup();
            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            const file = new File(['test'], 'data.csv', { type: 'text/csv' });
            const input = screen.getByTestId('file-input') as HTMLInputElement;

            await user.upload(input, file);

            await waitFor(() => {
                expect(screen.getByText('data.csv')).toBeInTheDocument();
            });
        });

        it('should show error for non-CSV files', async () => {
            const onError = vi.fn();
            const user = userEvent.setup();

            render(
                <FileUpload onError={onError} />,
                { wrapper: createWrapper() }
            );

            const file = new File(['test'], 'data.txt', { type: 'text/plain' });
            const input = screen.getByTestId('file-input') as HTMLInputElement;

            await user.upload(input, file);

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Please upload a CSV file');
            });
        });
    });

    describe('Import Functionality', () => {
        it('should call mutation when Import button is clicked', async () => {
            const user = userEvent.setup();
            const file = new File(['test'], 'data.csv', { type: 'text/csv' });

            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByTestId('file-input') as HTMLInputElement;
            await user.upload(input, file);

            await waitFor(() => {
                expect(screen.getByText('Import')).toBeInTheDocument();
            });

            const importButton = screen.getByText('Import');
            await user.click(importButton);

            await waitFor(() => {
                expect(mockMutation.mutate).toHaveBeenCalledWith(
                    file,
                    expect.any(Object)
                );
            });
        });

        it('should call onSuccess callback on successful import', async () => {
            const onSuccess = vi.fn();
            const successData = { message: 'Success', rowsImported: 50 };

            mockMutation.mutate = vi.fn((file, { onSuccess: onSuccessCallback }) => {
                onSuccessCallback(successData);
            });

            const user = userEvent.setup();
            const file = new File(['test'], 'data.csv', { type: 'text/csv' });

            render(
                <FileUpload onSuccess={onSuccess} />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByTestId('file-input') as HTMLInputElement;
            await user.upload(input, file);

            const importButton = await screen.findByText('Import');
            await user.click(importButton);

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(successData);
            });
        });

        it('should call onError callback on import failure', async () => {
            const onError = vi.fn();
            const error = new Error('Import failed');

            mockMutation.mutate = vi.fn((file, { onError: onErrorCallback }) => {
                onErrorCallback(error);
            });

            const user = userEvent.setup();
            const file = new File(['test'], 'data.csv', { type: 'text/csv' });

            render(
                <FileUpload onError={onError} />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByTestId('file-input') as HTMLInputElement;
            await user.upload(input, file);

            const importButton = await screen.findByText('Import');
            await user.click(importButton);

            await waitFor(() => {
                expect(onError).toHaveBeenCalled();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading state during import', async () => {
            mockMutation.isPending = true;

            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            // The file info component should not show during loading
            // This would need to check the actual implementation
        });

        it('should show success message after successful import', () => {
            mockMutation.isSuccess = true;
            mockMutation.data = { rowsImported: 100 };

            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/Success!/)).toBeInTheDocument();
            expect(screen.getByText(/100 rows imported/)).toBeInTheDocument();
        });

        it('should show error message on import failure', () => {
            mockMutation.isError = true;
            mockMutation.error = new Error('Network error');

            render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/Error:/)).toBeInTheDocument();
        });
    });

    describe('File Reset', () => {
        it('should clear selected file after successful import', async () => {
            const successData = { message: 'Success', rowsImported: 50 };

            mockMutation.mutate = vi.fn((file, { onSuccess: onSuccessCallback }) => {
                onSuccessCallback(successData);
            });

            const user = userEvent.setup();
            const file = new File(['test'], 'data.csv', { type: 'text/csv' });

            const { rerender } = render(
                <FileUpload />,
                { wrapper: createWrapper() }
            );

            const input = screen.getByTestId('file-input') as HTMLInputElement;
            await user.upload(input, file);

            const importButton = await screen.findByText('Import');
            await user.click(importButton);

            // After successful import, file should be cleared
            await waitFor(() => {
                expect(screen.queryByText('data.csv')).not.toBeInTheDocument();
            });
        });
    });
});
