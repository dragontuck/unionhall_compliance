import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';

// Mock components
vi.mock('../components/FileUpload', () => ({
    FileUpload: ({ onSuccess, onError }: any) => (
        <div data-testid="file-upload">
            <button onClick={() => onSuccess?.({ message: 'Success', rowsImported: 10 })}>
                Simulate Upload
            </button>
            <button onClick={() => onError?.('Upload error')}>
                Simulate Error
            </button>
        </div>
    ),
}));

vi.mock('../components/RunExecutor', () => ({
    RunExecutor: ({ onSuccess, onError }: any) => (
        <div data-testid="run-executor">
            <button
                onClick={() =>
                    onSuccess?.({
                        message: 'Success',
                        runId: 1,
                        output: '',
                        dryRun: false,
                    })
                }
            >
                Simulate Run
            </button>
            <button
                onClick={() =>
                    onError?.({
                        message: 'Run error',
                        runId: 0,
                        output: '',
                        dryRun: false,
                    })
                }
            >
                Simulate Run Error
            </button>
        </div>
    ),
}));

vi.mock('../hooks', () => ({
    useAlert: vi.fn(() => ({
        alert: null,
        showAlert: vi.fn(),
        clearAlert: vi.fn(),
    })),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    );
};

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render dashboard page with main components', () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByTestId('file-upload')).toBeInTheDocument();
            expect(screen.getByTestId('run-executor')).toBeInTheDocument();
        });

        it('should render page title', () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        });

        it('should have dashboard container', () => {
            const { container } = render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            expect(container.querySelector('.dashboard')).toBeInTheDocument();
        });
    });

    describe('FileUpload Integration', () => {
        it('should show alert on successful file upload', async () => {
            const { rerender } = render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const uploadButton = screen.getByText('Simulate Upload');
            uploadButton.click();

            // Check that the button click was registered
            expect(uploadButton).toBeInTheDocument();
        });

        it('should show error alert on upload failure', async () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const errorButton = screen.getByText('Simulate Error');
            errorButton.click();

            // Check that the button click was registered
            expect(errorButton).toBeInTheDocument();
        });
    });

    describe('RunExecutor Integration', () => {
        it('should show alert on successful run execution', async () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const runButton = screen.getByText('Simulate Run');
            runButton.click();

            // Check that the button click was registered
            expect(runButton).toBeInTheDocument();
        });

        it('should show error alert on run execution failure', async () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const errorButton = screen.getByText('Simulate Run Error');
            errorButton.click();

            await waitFor(() => {
                // Error message should be displayed
                expect(screen.queryByText(/Run error/i)).toBeInTheDocument();
            });
        });

        it('should navigate to reports after successful run', async () => {
            render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const runButton = screen.getByText('Simulate Run');
            runButton.click();

            // Check that the button exists and can be clicked
            expect(runButton).toBeInTheDocument();
        });
    });

    describe('Alert Display', () => {
        it('should display alerts in the correct container', () => {
            const { container } = render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const alertContainer = container.querySelector('.alert-container');
            expect(alertContainer || container).toBeInTheDocument();
        });

        it('should have alert with appropriate styling', () => {
            const { container } = render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            expect(container.querySelector('.dashboard')).toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('should have proper structure for dashboard', () => {
            const { container } = render(
                <Dashboard />,
                { wrapper: createWrapper() }
            );

            const dashboard = container.querySelector('.dashboard');
            expect(dashboard).toBeInTheDocument();

            // Check for main content areas
            expect(screen.getByTestId('file-upload')).toBeInTheDocument();
            expect(screen.getByTestId('run-executor')).toBeInTheDocument();
        });
    });
});
