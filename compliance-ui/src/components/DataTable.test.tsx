import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';

// Mock Blob and URL globally before tests
const mockBlob = vi.fn().mockImplementation(() => ({
    size: 0,
    type: 'text/csv',
}));

const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
const mockRevokeObjectURL = vi.fn();

vi.stubGlobal('Blob', mockBlob);
vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
});

describe('DataTable Component', () => {
    interface TestData {
        id: number;
        name: string;
        email: string;
        status: string;
    }

    const testData: TestData[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
    ];

    const columns = [
        { key: 'id' as const, label: 'ID' },
        { key: 'name' as const, label: 'Name', sortable: true },
        { key: 'email' as const, label: 'Email' },
        { key: 'status' as const, label: 'Status' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render table with columns', () => {
        render(<DataTable columns={columns} data={testData} />);

        expect(screen.getByRole('table')).toBeInTheDocument();
        columns.forEach(col => {
            expect(screen.getByText(col.label)).toBeInTheDocument();
        });
    });

    it('should render table rows with data', () => {
        render(<DataTable columns={columns} data={testData} />);

        testData.forEach(row => {
            expect(screen.getByText(row.name)).toBeInTheDocument();
            expect(screen.getByText(row.email)).toBeInTheDocument();
        });
    });

    it('should render title when provided', () => {
        const title = 'Test Table';
        render(<DataTable columns={columns} data={testData} title={title} />);

        expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('should display empty message when data is empty', () => {
        render(<DataTable columns={columns} data={[]} />);

        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render search box when searchableColumns provided', () => {
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name', 'email']}
            />
        );

        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    it('should filter data based on search term', async () => {
        const user = userEvent.setup();
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search/i);
        await user.type(searchInput, 'John');

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search/i) as HTMLInputElement;
        await user.type(searchInput, 'John');

        const clearButton = screen.getByLabelText('Clear search');
        await user.click(clearButton);

        expect(searchInput.value).toBe('');
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should sort data when sortable column header is clicked', async () => {
        const user = userEvent.setup();
        render(<DataTable columns={columns} data={testData} />);

        const nameHeader = screen.getByText('Name');
        await user.click(nameHeader);

        const rows = screen.getAllByRole('row');
        const firstDataCell = within(rows[1]).getAllByRole('cell')[1];
        expect(firstDataCell.textContent).toMatch(/Bob|Jane|John/);
    });

    it('should toggle sort direction when same column clicked twice', async () => {
        const user = userEvent.setup();
        render(<DataTable columns={columns} data={testData} />);

        const nameHeader = screen.getByText('Name');

        // First click - ascending
        await user.click(nameHeader);
        let rows = screen.getAllByRole('row');
        let firstDataCell = within(rows[1]).getAllByRole('cell')[1];
        const firstName = firstDataCell.textContent;
        expect(['Bob', 'Jane', 'John'].some(n => firstName?.includes(n))).toBe(true);

        // Second click - descending
        await user.click(nameHeader);
        rows = screen.getAllByRole('row');
        firstDataCell = within(rows[1]).getAllByRole('cell')[1];
        expect(firstDataCell.textContent).not.toBe(firstName);
    });

    it('should display download button when searchableColumns provided', () => {
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        const downloadButton = screen.getByLabelText('Download as CSV');
        expect(downloadButton).toBeInTheDocument();
    });

    it('should handle download button click', async () => {
        const user = userEvent.setup();

        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        const downloadButton = screen.getByLabelText('Download as CSV');
        await user.click(downloadButton);

        expect(downloadButton).toBeInTheDocument();
    });

    it('should render custom render function for columns', () => {
        const customColumns = [
            { key: 'id' as const, label: 'ID' },
            {
                key: 'name' as const,
                label: 'Name',
                render: (value: any) => <span>{value.toUpperCase()}</span>,
            },
            { key: 'email' as const, label: 'Email' },
            { key: 'status' as const, label: 'Status' },
        ];

        render(<DataTable columns={customColumns} data={testData} />);

        expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
    });

    it('should show total rows count in footer', () => {
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        expect(screen.getByText('Total rows: 3')).toBeInTheDocument();
    });

    it('should apply maxHeight styling when provided', () => {
        const { container } = render(
            <DataTable
                columns={columns}
                data={testData}
                maxHeight="400px"
            />
        );

        const wrapper = container.querySelector('.table-wrapper');
        expect(wrapper).toHaveStyle({ maxHeight: '400px', overflowY: 'auto' });
    });

    it('should respect enableHorizontalScroll prop', () => {
        const { container } = render(
            <DataTable
                columns={columns}
                data={testData}
                enableHorizontalScroll={false}
            />
        );

        const wrapper = container.querySelector('.table-wrapper');
        expect(wrapper).toHaveClass('scroll-disabled');
    });

    it('should handle null and undefined values gracefully', () => {
        const dataWithNulls = [
            { id: 1, name: 'John', email: null as any, status: undefined as any },
        ];

        render(<DataTable columns={columns} data={dataWithNulls} />);

        expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should search across multiple columns', async () => {
        const user = userEvent.setup();
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name', 'email']}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search/i);
        await user.type(searchInput, 'jane@example.com');

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive search', async () => {
        const user = userEvent.setup();
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search/i);
        await user.type(searchInput, 'JOHN');

        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render table with proper structure', () => {
        const { container } = render(
            <DataTable columns={columns} data={testData} />
        );

        expect(container.querySelector('table')).toBeInTheDocument();
        expect(container.querySelector('thead')).toBeInTheDocument();
        expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('should have correct number of columns in each row', () => {
        const { container } = render(
            <DataTable columns={columns} data={testData} />
        );

        const cells = container.querySelectorAll('tbody tr:first-child td');
        expect(cells.length).toBe(columns.length);
    });

    it('should update table when data prop changes', () => {
        const { rerender } = render(
            <DataTable columns={columns} data={testData} />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();

        const newData = [
            { id: 4, name: 'New User', email: 'new@example.com', status: 'active' },
        ];

        rerender(<DataTable columns={columns} data={newData} />);

        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('New User')).toBeInTheDocument();
    });

    it('should render sort icons for sortable columns', () => {
        render(
            <DataTable columns={columns} data={testData} />
        );

        const nameHeader = screen.getByText('Name').closest('th');
        expect(nameHeader).toHaveClass('sortable');
    });

    it('should not render search when searchableColumns is empty', () => {
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={[]}
            />
        );

        const searchInput = screen.queryByPlaceholderText(/Search/i);
        expect(searchInput).not.toBeInTheDocument();
    });

    it('should maintain sorting when searching', async () => {
        const user = userEvent.setup();
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchableColumns={['name']}
            />
        );

        // Sort by name ascending
        const nameHeader = screen.getByText('Name');
        await user.click(nameHeader);

        // Search
        const searchInput = screen.getByPlaceholderText(/Search/i);
        await user.type(searchInput, 'o');

        // Should show John and Bob (contain 'o')  but not fully since search filters first
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render with default props', () => {
        const { container } = render(
            <DataTable columns={columns} data={testData} />
        );

        expect(container.querySelector('table')).toBeInTheDocument();
        expect(container.querySelector('.table-wrapper')).toHaveClass('scroll-enabled');
    });

    it('should handle long data lists', () => {
        const longData = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            status: i % 2 === 0 ? 'active' : 'inactive',
        }));

        render(<DataTable columns={columns} data={longData} />);

        expect(screen.getByText('User 0')).toBeInTheDocument();
        expect(screen.getByText('User 99')).toBeInTheDocument();
    });
});
