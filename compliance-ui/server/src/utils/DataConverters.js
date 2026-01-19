/**
 * DataConverters - Utility functions for data type conversions
 * Follows Single Responsibility Principle (SRP)
 * Only handles data conversion logic
 */

export const DataConverters = {
    /**
     * Convert value to integer
     * @param {*} val - Value to convert
     * @returns {number|null} Integer or null
     */
    toInt(val) {
        if (val === undefined || val === null) return null;
        const num = parseInt(String(val).trim(), 10);
        return isNaN(num) ? null : num;
    },

    /**
     * Convert value to boolean
     * @param {*} val - Value to convert
     * @returns {boolean|null} Boolean or null
     */
    toBool(val) {
        if (val === undefined || val === null) return null;
        const s = String(val).trim().toLowerCase();
        if (s === '' || s === 'null') return null;
        if (['1', 'true', 'yes', 'y'].includes(s)) return true;
        if (['0', 'false', 'no', 'n'].includes(s)) return false;
        return null;
    },

    /**
     * Convert value to date string
     * @param {*} val - Value to convert
     * @returns {string|null} Date string or null
     */
    toDate(val) {
        if (!val || String(val).trim() === '' || String(val).trim().toLowerCase() === 'null') {
            return null;
        }
        return String(val).trim();
    },

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format string (e.g., 'YYYY-MM-DD')
     * @returns {string} Formatted date
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d)) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    },

    /**
     * Parse date string
     * @param {string} dateStr - Date string
     * @returns {Date|null} Parsed date or null
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date) ? null : date;
    }
};
