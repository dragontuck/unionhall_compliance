/**
 * Date utilities
 * Single Responsibility Principle: Only handles date formatting
 */

/**
 * Formats date to YYYY-MM-DD format
 */
export function formatDateToInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats date to readable format (MM/DD/YYYY)
 */
export function formatDateForDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
}

/**
 * Parses date string
 */
export function parseDate(dateString: string): Date {
    return new Date(dateString);
}
