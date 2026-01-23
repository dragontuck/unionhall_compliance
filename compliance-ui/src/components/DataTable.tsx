import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import '../styles/DataTable.css';

interface Column<T> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    title?: string;
    searchableColumns?: (keyof T)[];
    enableHorizontalScroll?: boolean;
    maxHeight?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    title,
    searchableColumns = [],
    enableHorizontalScroll = true,
    maxHeight,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T;
        direction: 'asc' | 'desc';
    } | null>(null);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((row) =>
            searchableColumns.some((column) => {
                const value = row[column];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, searchableColumns]);

    const sortedData = useMemo(() => {
        let sorted = [...filteredData];
        if (sortConfig) {
            sorted.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredData, sortConfig]);

    const handleSort = (key: keyof T) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

    const SortIcon = ({ column }: { column: Column<T> }) => {
        if (!column.sortable) return null;
        if (sortConfig?.key !== column.key) {
            return <span className="sort-icon opacity-30">⇅</span>;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp size={16} className="sort-icon" />
        ) : (
            <ChevronDown size={16} className="sort-icon" />
        );
    };

    const downloadAsCSV = () => {
        // Create CSV header
        const headers = columns.map(col => col.label).join(',');

        // Create CSV rows from sorted/filtered data
        const rows = sortedData.map(row =>
            columns.map(col => {
                let value = row[col.key];
                // If column has a render function, we need the raw value
                // For simplicity, we'll use the string representation
                value = String(value ?? '');
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',')
        );

        // Combine headers and rows
        const csv = [headers, ...rows].join('\n');

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `table_export_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="data-table-container">
            {title && <h3 className="data-table-title">{title}</h3>}

            {searchableColumns.length > 0 && (
                <div className="search-controls">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${searchableColumns.join(', ')}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="clear-search"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        onClick={downloadAsCSV}
                        className="datatable-download-button"
                        aria-label="Download as CSV"
                        title="Download table as CSV"
                    >
                        <Download size={14} />
                    </button>
                </div>
            )}

            <div
                className={`table-wrapper ${enableHorizontalScroll ? 'scroll-enabled' : 'scroll-disabled'}`}
                style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
            >
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                    className={column.sortable ? 'sortable' : ''}
                                >
                                    <div className="header-content">
                                        {column.label}
                                        {column.sortable && <SortIcon column={column} />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="empty-message">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, idx) => (
                                <tr key={idx}>
                                    {columns.map((column) => (
                                        <td key={String(column.key)}>
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : String(row[column.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                {searchTerm && <p>Showing {sortedData.length} of {data.length} results</p>}
                {!searchTerm && <p>Total rows: {data.length}</p>}
            </div>
        </div>
    );
}
