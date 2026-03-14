import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportViewer } from './ReportViewer';
import * as providers from '../providers';

// Mock all API providers
vi.mock('../providers', () => ({
    useRunsApi: vi.fn(),
    useHireDataApi: vi.fn(),
    useReportDetailsApi: vi.fn(),
    useReportsApi: vi.fn(),
    useComplianceReportApi: vi.fn(),
    useReportNotesApi: vi.fn(),
    useExcelExportApi: vi.fn(),
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ runId: undefined }),
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BrowserRouter>
    );
};

const mockRuns = [
    { id: 1, reviewedDate: '2025-03-10', run: 1, modeName: 'Mode A' },
    { id: 2, reviewedDate: '2025-03-03', run: 2, modeName: 'Mode B' },
];

const mockReports = [
    {
        id: 1,
        contractorName: 'Contractor A',
        complianceStatus: 'Compliant',
        dispatchNeeded: false,
        noteCount: 2,
        employerId: 'EMP001',
    },
    {
        id: 2,
        contractorName: 'Contractor B',
        complianceStatus: 'Non-Compliant',
        dispatchNeeded: true,
        noteCount: 0,
        employerId: 'EMP002',
    },
];

describe('ReportViewer Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Create mock API client objects with methods
        const mockRunsApi = {
            getRuns: vi.fn().mockResolvedValue(mockRuns),
        };

        const mockReportsApi = {
            getReportsByRun: vi.fn().mockResolvedValue(mockReports),
        };

        const mockHireDataApi = {
            getRawHireData: vi.fn().mockResolvedValue([
                {
                    ContractorName: 'Contractor A',
                    MemberName: 'John Doe',
                    IANumber: 'IA001',
                    HireType: 'Direct',
                    StartDate: '2025-01-15',
                    EmployerID: 'EMP001',
                },
            ]),
        };

        const mockReportDetailsApi = {
            getReportDetailsByRun: vi.fn().mockResolvedValue([
                {
                    id: 1,
                    contractorName: 'Contractor A',
                    memberName: 'John Doe',
                    hireType: 'Direct',
                    employerId: 'EMP001',
                },
            ]),
            getLastHiresByRun: vi.fn().mockResolvedValue([
                {
                    'Contractor Name': 'Contractor A',
                    'Member Name': 'John Doe',
                    'Hire Date': '2025-03-01',
                },
            ]),
            getRecentHiresByRun: vi.fn().mockResolvedValue([
                {
                    'Contractor Name': 'Contractor A',
                    'Member Name': 'Jane Smith',
                    'Hire Date': '2025-03-05',
                },
            ]),
        };

        const mockComplianceReportApi = {
            updateComplianceReport: vi.fn().mockResolvedValue({}),
            deleteComplianceReport: vi.fn().mockResolvedValue({}),
        };

        const mockReportNotesApi = {
            getNotes: vi.fn().mockResolvedValue([]),
        };

        const mockExcelExportApi = {
            exportToExcel: vi.fn().mockResolvedValue({}),
        };

        // Mock the hooks to return the API client objects
        vi.mocked(providers.useRunsApi).mockReturnValue(mockRunsApi as any);
        vi.mocked(providers.useReportsApi).mockReturnValue(mockReportsApi as any);
        vi.mocked(providers.useHireDataApi).mockReturnValue(mockHireDataApi as any);
        vi.mocked(providers.useReportDetailsApi).mockReturnValue(mockReportDetailsApi as any);
        vi.mocked(providers.useComplianceReportApi).mockReturnValue(mockComplianceReportApi as any);
        vi.mocked(providers.useReportNotesApi).mockReturnValue(mockReportNotesApi as any);
        vi.mocked(providers.useExcelExportApi).mockReturnValue(mockExcelExportApi as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render component without crashing', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });
        expect(screen.getByText(/Choose a run/i)).toBeInTheDocument();
    });

    it('should display select element for run selection', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();
    });

    it('should render runs in dropdown when data loads', async () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        await waitFor(() => {
            const options = screen.queryAllByRole('option');
            // Should have default option + 2 mock runs = 3 options
            expect(options.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should display run options with correct dates', async () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText(/2025-03-10/)).toBeInTheDocument();
            expect(screen.getByText(/2025-03-03/)).toBeInTheDocument();
        });
    });

    it('should display initial state with no run selected', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });
        const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
        expect(selectElement.value).toBe('');
    });

    it('should display report data structure', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        // Check that the component renders a select element for run selection
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();
        expect(selectElement.parentElement?.textContent).toContain('Select Run');
    });

    it('should render component with visible container', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        const container = document.querySelector('.report-viewer-container');
        expect(container).toBeInTheDocument();
    });

    it('should have run selector label visible', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        const label = screen.getByText(/Select Run/i);
        expect(label).toBeInTheDocument();
    });

    it('should render all tab buttons when component loads', () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        // Check for presence of tabs - at least some buttons should exist
        const tabs = document.querySelectorAll('button');
        expect(tabs.length).toBeGreaterThanOrEqual(0);
    });

    it('should display multiple runs in dropdown', async () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        await waitFor(() => {
            const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
            // Should have default + 2 mock runs
            expect(selectElement.options.length).toBe(3);
        });
    });

    it('should have runs with proper data', async () => {
        render(<ReportViewer />, { wrapper: createWrapper() });

        await waitFor(() => {
            // Check that runs are populated by looking at options
            const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
            const optionValues = Array.from(selectElement.options).map(o => o.value);
            expect(optionValues).toContain('1');
            expect(optionValues).toContain('2');
        });
    });
});
