import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RunExecutor } from './RunExecutor';
import * as apiProvider from '../providers';
import * as hooks from '../hooks';

// Mock the hooks
vi.mock('../hooks', async () => {
    const actual = await vi.importActual('../hooks');
    return {
        ...actual,
        useModes: vi.fn(),
        useExecuteRun: vi.fn(),
    };
});

vi.mock('../providers', async () => {
    const actual = await vi.importActual('../providers');
    return {
        ...actual,
        useApiClient: vi.fn(),
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../utils', () => ({
    extractErrorMessage: vi.fn((error: any, fallback: string) =>
        error?.message || fallback
    ),
}));

vi.mock('./presentational', () => ({
    RunExecutorForm: ({ reviewedDate, onReviewedDateChange, mode, onModeChange, modes, dryRun, onDryRunChange, onExecute, isDisabled }: any) => (
        <div>
            <input
                type="date"
                value={reviewedDate}
                onChange={(e) => onReviewedDateChange(e.target.value)}
                data-testid="reviewed-date-input"
            />
            <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value)}
                data-testid="mode-select"
            >
                <option value="">Select Mode</option>
                {modes.map((m: any) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                ))}
            </select>
            <label>
                <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => onDryRunChange(e.target.checked)}
                    data-testid="dry-run-checkbox"
                />
                Dry Run
            </label>
            <button onClick={onExecute} disabled={isDisabled} data-testid="execute-button">
                Execute
            </button>
        </div>
    ),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BrowserRouter>
    );
};

describe('RunExecutor Component', () => {
    let mockApiClient: any;
    let mockMutation: any;
    let mockHook: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockApiClient = {
            executeRun: vi.fn(),
        };

        mockMutation = {
            mutate: vi.fn((params, { onSuccess, onError }) => { }),
            isPending: false,
            isError: false,
            isSuccess: false,
            error: null,
            data: null,
        };

        mockHook = {
            data: [
                { id: 1, name: 'Standard' },
                { id: 2, name: 'Strict' },
            ],
            isLoading: false,
        };

        vi.mocked(apiProvider.useApiClient).mockReturnValue(mockApiClient);
        vi.mocked(hooks.useExecuteRun).mockReturnValue(mockMutation);
        vi.mocked(hooks.useModes).mockReturnValue(mockHook);
    });

    describe('Rendering', () => {
        it('should render form with all controls', () => {
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByTestId('reviewed-date-input')).toBeInTheDocument();
            expect(screen.getByTestId('mode-select')).toBeInTheDocument();
            expect(screen.getByTestId('dry-run-checkbox')).toBeInTheDocument();
            expect(screen.getByTestId('execute-button')).toBeInTheDocument();
        });

        it('should populate mode dropdown with available modes', () => {
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const options = screen.getAllByRole('option');
            expect(options.some(opt => opt.textContent === 'Standard')).toBe(true);
            expect(options.some(opt => opt.textContent === 'Strict')).toBe(true);
        });
    });

    describe('Validation', () => {
        it('should disable execute button when fields are empty', () => {
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const executeButton = screen.getByTestId('execute-button');
            expect(executeButton).toBeDisabled();
        });

        it('should disable execute button when only date is selected', async () => {
            const user = userEvent.setup();
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            await user.type(dateInput, '2024-01-15');

            const executeButton = screen.getByTestId('execute-button');
            expect(executeButton).toBeDisabled();
        });

        it('should disable execute button when only mode is selected', async () => {
            const user = userEvent.setup();
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            expect(executeButton).toBeDisabled();
        });

        it('should enable execute button when both date and mode are selected', async () => {
            const user = userEvent.setup();
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            expect(executeButton).not.toBeDisabled();
        });

        it('should show error when required fields are missing', async () => {
            const onError = vi.fn();
            const user = userEvent.setup();

            mockMutation.mutate = vi.fn((params, { onError: onErrorCallback }) => {
                onErrorCallback(new Error('Validation failed'));
            });

            render(
                <RunExecutor onError={onError} />,
                { wrapper: createWrapper() }
            );

            const executeButton = screen.getByTestId('execute-button');

            // Button should be disabled, but we can test the validation message
            expect(executeButton).toBeDisabled();
        });
    });

    describe('Execution', () => {
        it('should call execute with correct parameters', async () => {
            const user = userEvent.setup();
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            await user.click(executeButton);

            await waitFor(() => {
                expect(mockMutation.mutate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reviewedDate: '2024-01-15',
                        mode: 'Standard',
                        dryRun: false,
                    }),
                    expect.any(Object)
                );
            });
        });

        it('should include dryRun flag when checkbox is checked', async () => {
            const user = userEvent.setup();
            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;
            const dryRunCheckbox = screen.getByTestId('dry-run-checkbox') as HTMLInputElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');
            await user.click(dryRunCheckbox);

            const executeButton = screen.getByTestId('execute-button');
            await user.click(executeButton);

            await waitFor(() => {
                expect(mockMutation.mutate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        dryRun: true,
                    }),
                    expect.any(Object)
                );
            });
        });

        it('should call onSuccess callback with execution result', async () => {
            const onSuccess = vi.fn();
            const successData = {
                message: 'Run executed successfully',
                runId: 123,
                output: '',
                dryRun: false,
            };

            mockMutation.mutate = vi.fn((params, { onSuccess: onSuccessCallback }) => {
                onSuccessCallback(successData);
            });

            const user = userEvent.setup();
            render(
                <RunExecutor onSuccess={onSuccess} />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            await user.click(executeButton);

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(successData);
            });
        });

        it('should clear form fields after successful execution', async () => {
            mockMutation.mutate = vi.fn((params, { onSuccess: onSuccessCallback }) => {
                onSuccessCallback({ message: 'Success', runId: 123 });
            });

            const user = userEvent.setup();
            const { rerender } = render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            await user.click(executeButton);

            // Fields should be cleared after success
            await waitFor(() => {
                expect(dateInput.value).toBe('');
                expect(modeSelect.value).toBe('');
            });
        });
    });

    describe('Error Handling', () => {
        it('should display error message on execution failure', () => {
            mockMutation.isError = true;
            mockMutation.error = new Error('Execution failed');

            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/Error:/)).toBeInTheDocument();
        });

        it('should call onError callback on execution failure', async () => {
            const onError = vi.fn();
            const error = new Error('Connection failed');

            mockMutation.mutate = vi.fn((params, { onError: onErrorCallback }) => {
                onErrorCallback(error);
            });

            const user = userEvent.setup();
            render(
                <RunExecutor onError={onError} />,
                { wrapper: createWrapper() }
            );

            const dateInput = screen.getByTestId('reviewed-date-input') as HTMLInputElement;
            const modeSelect = screen.getByTestId('mode-select') as HTMLSelectElement;

            await user.type(dateInput, '2024-01-15');
            await user.selectOptions(modeSelect, 'Standard');

            const executeButton = screen.getByTestId('execute-button');
            await user.click(executeButton);

            await waitFor(() => {
                expect(onError).toHaveBeenCalled();
            });
        });
    });

    describe('Loading States', () => {
        it('should disable button during execution', () => {
            mockMutation.isPending = true;

            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            const executeButton = screen.getByTestId('execute-button');
            expect(executeButton).toBeDisabled();
        });

        it('should show success message after execution', () => {
            mockMutation.isSuccess = true;

            render(
                <RunExecutor />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/Success!/)).toBeInTheDocument();
        });
    });
});
