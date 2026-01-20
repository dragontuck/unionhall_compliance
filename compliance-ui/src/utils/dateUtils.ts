/**
 * Date utilities
 * Single Responsibility Principle: Only handles date formatting
 */

/**
 * Formats date to YYYY-MM-DD format - returns empty string for null/undefined
 */
export function formatDateToInput(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}

/**
 * Formats date to readable format (MM/DD/YYYY) - returns empty string for null/undefined
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '';
    }
}

/**
 * Parses date string - returns null for invalid dates
 */
export function parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}
