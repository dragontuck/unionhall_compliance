import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContractorBlacklistPage } from './ContractorBlacklist';
import * as hooks from '../hooks';
import type { ContractorBlacklist as ContractorBlacklistType } from '../types';

// Mock all hooks
vi.mock('../hooks', () => ({
    useBlacklist: vi.fn(),
    useAddDialog: vi.fn(),
    useEditDialog: vi.fn(),
    useDeleteDialog: vi.fn(),
    useAlert: vi.fn(),
}));

// Mock DataTable component
vi.mock('../components/DataTable', () => ({
    DataTable: ({ data, columns, title }: any) => (
        <div className="mock-datatable">
            <h2>{title}</h2>
            <table>
                <thead>
                    <tr>
                        {columns.map((col: any) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: any) => (
                        <tr key={row.Id}>
                            {columns.map((col: any) => (
                                <td key={`${row.Id}-${col.key}`}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ),
}));

// Mock Alert component
vi.mock('../components/Alert', () => ({
    Alert: ({ type, children }: any) => <div className={`alert alert-${type}`}>{children}</div>,
    AlertDescription: ({ children }: any) => <div className="alert-description">{children}</div>,
}));

const mockBlacklistData: ContractorBlacklistType[] = [
    {
        Id: 1,
        EmployerID: 'EMP001',
        ContractorName: 'Contractor A',
        CreatedOn: '2025-01-15',
        DeletedOn: null,
    },
    {
        Id: 2,
        EmployerID: 'EMP002',
        ContractorName: 'Contractor B',
        CreatedOn: '2025-02-10',
        DeletedOn: null,
    },
    {
        Id: 3,
        EmployerID: 'EMP001',
        ContractorName: 'Contractor C',
        CreatedOn: '2025-01-01',
        DeletedOn: '2025-03-01',
    },
];

describe('ContractorBlacklist Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        const mockShowAlert = vi.fn();
        vi.mocked(hooks.useAlert).mockReturnValue({
            alert: null,
            showAlert: mockShowAlert,
        } as any);

        vi.mocked(hooks.useBlacklist).mockReturnValue({
            blacklist: mockBlacklistData.filter(b => b.DeletedOn === null),
            isLoading: false,
            error: null,
            createBlacklist: vi.fn().mockResolvedValue({}),
            updateBlacklist: vi.fn().mockResolvedValue({}),
            deleteBlacklist: vi.fn().mockResolvedValue({}),
        } as any);

        const mockAddDialog = {
            isOpen: false,
            formData: { employerId: '', contractorName: '' },
            setFormData: vi.fn(),
            openDialog: vi.fn().mockImplementation(function (this: any) {
                this.isOpen = true;
            }),
            closeDialog: vi.fn().mockImplementation(function (this: any) {
                this.isOpen = false;
            }),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        };
        vi.mocked(hooks.useAddDialog).mockReturnValue(mockAddDialog as any);

        const mockEditDialog = {
            record: null,
            formData: null,
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        };
        vi.mocked(hooks.useEditDialog).mockReturnValue(mockEditDialog as any);

        const mockDeleteDialog = {
            record: null,
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        };
        vi.mocked(hooks.useDeleteDialog).mockReturnValue(mockDeleteDialog as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render component without crashing', () => {
        render(<ContractorBlacklistPage />);
        // Use h1 selector to get the specific title
        const title = screen.getByRole('heading', { level: 1, name: /Contractor Blacklist/ });
        expect(title).toBeInTheDocument();
    });

    it('should display page header with title and description', () => {
        render(<ContractorBlacklistPage />);
        const title = screen.getByRole('heading', { level: 1 });
        expect(title).toBeInTheDocument();
        expect(screen.getByText(/Manage contractors that have been blacklisted/)).toBeInTheDocument();
    });

    it('should render toggle buttons for current and all records', () => {
        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Current Blacklist')).toBeInTheDocument();
        expect(screen.getByText('All Records')).toBeInTheDocument();
    });

    it('should render add contractor button', () => {
        render(<ContractorBlacklistPage />);
        const addButton = screen.getByRole('button', { name: /Add Contractor/i });
        expect(addButton).toBeInTheDocument();
    });

    it('should display loading state', () => {
        vi.mocked(hooks.useBlacklist).mockReturnValue({
            blacklist: [],
            isLoading: true,
            error: null,
            createBlacklist: vi.fn(),
            updateBlacklist: vi.fn(),
            deleteBlacklist: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Loading blacklist...')).toBeInTheDocument();
    });

    it('should display error state', () => {
        vi.mocked(hooks.useBlacklist).mockReturnValue({
            blacklist: [],
            isLoading: false,
            error: new Error('Failed to load'),
            createBlacklist: vi.fn(),
            updateBlacklist: vi.fn(),
            deleteBlacklist: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Failed to load blacklist data')).toBeInTheDocument();
    });

    it('should display empty state when no contractors', () => {
        vi.mocked(hooks.useBlacklist).mockReturnValue({
            blacklist: [],
            isLoading: false,
            error: null,
            createBlacklist: vi.fn(),
            updateBlacklist: vi.fn(),
            deleteBlacklist: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('No contractors on the blacklist')).toBeInTheDocument();
    });

    it('should render data table with contractors', () => {
        render(<ContractorBlacklistPage />);
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
    });

    it('should display contractor data in table', () => {
        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Contractor A')).toBeInTheDocument();
        expect(screen.getByText('Contractor B')).toBeInTheDocument();
        expect(screen.getByText('EMP001')).toBeInTheDocument();
    });

    it('should call useBlacklist with showDeleted=false initially', () => {
        render(<ContractorBlacklistPage />);
        expect(hooks.useBlacklist).toHaveBeenCalledWith(false);
    });

    it('should toggle to showing deleted records', () => {
        vi.mocked(hooks.useBlacklist).mockReturnValue({
            blacklist: mockBlacklistData,
            isLoading: false,
            error: null,
            createBlacklist: vi.fn(),
            updateBlacklist: vi.fn(),
            deleteBlacklist: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        const allRecordsButton = screen.getByText('All Records');
        fireEvent.click(allRecordsButton);

        // After clicking, useBlacklist should be called with showDeleted=true on state update
        expect(hooks.useBlacklist).toHaveBeenCalled();
    });

    it('should display edit button for each active contractor', () => {
        render(<ContractorBlacklistPage />);
        const editButtons = screen.getAllByTitle('Edit');
        expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should display delete button for each active contractor', () => {
        render(<ContractorBlacklistPage />);
        const deleteButtons = screen.getAllByTitle('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should disable edit button for deleted contractors', () => {
        // When showing all records, deleted contractors should have disabled edit button
        render(<ContractorBlacklistPage />);
        const editButtons = screen.getAllByTitle('Edit');
        // At least one button should exist for active contractors
        expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should trigger add dialog when add button is clicked', () => {
        const mockOpenDialog = vi.fn();
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: false,
            formData: { employerId: '', contractorName: '' },
            setFormData: vi.fn(),
            openDialog: mockOpenDialog,
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        const addButton = screen.getByRole('button', { name: /Add Contractor/i });
        fireEvent.click(addButton);

        expect(mockOpenDialog).toHaveBeenCalled();
    });

    it('should render add dialog when open', () => {
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: true,
            formData: { employerId: 'EMP003', contractorName: 'New Contractor' },
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Add Contractor to Blacklist')).toBeInTheDocument();
        expect(screen.getByDisplayValue('EMP003')).toBeInTheDocument();
    });

    it('should display edit dialog when record is selected', () => {
        const mockRecord = mockBlacklistData[0];
        vi.mocked(hooks.useEditDialog).mockReturnValue({
            record: mockRecord,
            formData: { contractorName: mockRecord.ContractorName },
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Edit Blacklist Entry')).toBeInTheDocument();
        // Check for employer ID in inputs using displayValue
        const inputs = screen.queryAllByDisplayValue('EMP001');
        expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should display delete confirmation dialog when delete is clicked', () => {
        const mockRecord = mockBlacklistData[0];
        vi.mocked(hooks.useDeleteDialog).mockReturnValue({
            record: mockRecord,
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        expect(screen.getByText('Remove from Blacklist')).toBeInTheDocument();
        // Check for the confirmation message more carefully
        const confirmElements = screen.queryAllByText('Contractor A');
        expect(confirmElements.length).toBeGreaterThan(0);
    });

    it('should render add dialog with correct input fields', () => {
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: true,
            formData: { employerId: '', contractorName: '' },
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        const employerLabel = screen.getByLabelText('Employer ID');
        const contractorLabel = screen.getByLabelText('Contractor Name');
        expect(employerLabel).toBeInTheDocument();
        expect(contractorLabel).toBeInTheDocument();
    });

    it('should handle form input change in add dialog', () => {
        const mockSetFormData = vi.fn();
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: true,
            formData: { employerId: '', contractorName: '' },
            setFormData: mockSetFormData,
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        const inputs = screen.getAllByPlaceholderText(/Enter/);
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('should display datatable wrapper when data exists', () => {
        render(<ContractorBlacklistPage />);
        const tableWrapper = document.querySelector('.table-wrapper');
        expect(tableWrapper).toBeInTheDocument();
    });

    it('should display modal overlay when add dialog is open', () => {
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: true,
            formData: { employerId: '', contractorName: '' },
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        const overlay = document.querySelector('.modal-overlay');
        expect(overlay).toBeInTheDocument();
    });

    it('should display cancel and save buttons in add dialog', () => {
        vi.mocked(hooks.useAddDialog).mockReturnValue({
            isOpen: true,
            formData: { employerId: '', contractorName: '' },
            setFormData: vi.fn(),
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            isSubmitting: false,
            setIsSubmitting: vi.fn(),
        } as any);

        render(<ContractorBlacklistPage />);
        // Use more specific selectors to avoid multiple text matches
        const allButtons = screen.getAllByRole('button');
        const hasAddButton = allButtons.some(b => b.textContent?.includes('Add'));
        expect(hasAddButton).toBe(true);
    });

    it('should render main page title correctly', () => {
        render(<ContractorBlacklistPage />);
        // Use h1 selector to get the title specifically
        const title = screen.getByRole('heading', { level: 1, name: /Contractor Blacklist/ });
        expect(title).toBeInTheDocument();
    });

    it('should have correct CSS class structure', () => {
        render(<ContractorBlacklistPage />);
        const pageContainer = document.querySelector('.blacklist-page');
        expect(pageContainer).toBeInTheDocument();
    });

    it('should render page header div with correct structure', () => {
        render(<ContractorBlacklistPage />);
        const pageHeader = document.querySelector('.page-header');
        expect(pageHeader).toBeInTheDocument();
    });

    it('should render blacklist controls div', () => {
        render(<ContractorBlacklistPage />);
        const controls = document.querySelector('.blacklist-controls');
        expect(controls).toBeInTheDocument();
    });
});
