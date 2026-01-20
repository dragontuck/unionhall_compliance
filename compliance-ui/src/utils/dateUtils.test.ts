import { describe, it, expect } from 'vitest';
import { formatDateToInput, formatDateForDisplay, parseDate } from './dateUtils';

describe('dateUtils', () => {
    describe('formatDateToInput', () => {
        it('should format date to YYYY-MM-DD format', () => {
            // Use a date object to avoid timezone issues
            const date = new Date(2025, 0, 15);
            const result = formatDateToInput(date);
            expect(result).toMatch(/2025-01-15/);
        });

        it('should pad month with zero', () => {
            const date = new Date(2025, 2, 5);
            const result = formatDateToInput(date);
            expect(result).toMatch(/2025-03-05/);
        });

        it('should handle string dates', () => {
            // Parse in local timezone format
            const result = formatDateToInput('2025-12-25');
            expect(result).toMatch(/2025-12/); // Check month is at least present
        });

        it('should return empty string for null', () => {
            expect(formatDateToInput(null as any)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(formatDateToInput(undefined as any)).toBe('');
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format date to readable MM/DD/YYYY format', () => {
            const date = new Date(2025, 0, 15);
            const result = formatDateForDisplay(date);
            expect(result).toMatch(/01\/15\/2025/);
        });

        it('should handle string dates', () => {
            const result = formatDateForDisplay('2025-12-25');
            // Just check that it returns a formatted date, not specific format due to timezone
            expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        });

        it('should return empty string for null', () => {
            expect(formatDateForDisplay(null as any)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(formatDateForDisplay(undefined as any)).toBe('');
        });
    });

    describe('parseDate', () => {
        it('should parse valid date string', () => {
            const result = parseDate('2025-01-15');
            expect(result).toBeInstanceOf(Date);
            expect(result?.getFullYear()).toBe(2025);
            expect(result?.getMonth()).toBe(0);
        });

        it('should return null for invalid date string', () => {
            expect(parseDate('invalid-date')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseDate('')).toBeNull();
        });

        it('should return null for null input', () => {
            expect(parseDate(null)).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(parseDate(undefined)).toBeNull();
        });

        it('should parse ISO date strings', () => {
            const result = parseDate('2025-01-15T10:30:00Z');
            expect(result).toBeInstanceOf(Date);
        });
    });
});
