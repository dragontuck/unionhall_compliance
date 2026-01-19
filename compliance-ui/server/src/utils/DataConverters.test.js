/**
 * DataConverters.test.js - Unit tests for data converter utilities
 */

import { DataConverters } from './DataConverters.js';

describe('DataConverters', () => {
    describe('toInt', () => {
        it('should convert string to integer', () => {
            expect(DataConverters.toInt('123')).toBe(123);
            expect(DataConverters.toInt('456')).toBe(456);
        });

        it('should handle null and undefined', () => {
            expect(DataConverters.toInt(null)).toBeNull();
            expect(DataConverters.toInt(undefined)).toBeNull();
        });

        it('should return null for invalid values', () => {
            expect(DataConverters.toInt('abc')).toBeNull();
        });

        it('should handle floating point strings', () => {
            expect(DataConverters.toInt('12.34')).toBe(12);
        });
    });

    describe('toBool', () => {
        it('should convert truthy strings to boolean', () => {
            expect(DataConverters.toBool('true')).toBe(true);
            expect(DataConverters.toBool('1')).toBe(true);
            expect(DataConverters.toBool('yes')).toBe(true);
            expect(DataConverters.toBool('y')).toBe(true);
        });

        it('should convert falsy strings to boolean', () => {
            expect(DataConverters.toBool('false')).toBe(false);
            expect(DataConverters.toBool('0')).toBe(false);
            expect(DataConverters.toBool('no')).toBe(false);
            expect(DataConverters.toBool('n')).toBe(false);
        });

        it('should handle null and undefined', () => {
            expect(DataConverters.toBool(null)).toBeNull();
            expect(DataConverters.toBool(undefined)).toBeNull();
        });

        it('should handle null string', () => {
            expect(DataConverters.toBool('null')).toBeNull();
        });
    });

    describe('toDate', () => {
        it('should convert string to date string', () => {
            const result = DataConverters.toDate('2025-01-15');
            expect(result).toBe('2025-01-15');
        });

        it('should return null for empty strings', () => {
            expect(DataConverters.toDate('')).toBeNull();
            expect(DataConverters.toDate(null)).toBeNull();
        });

        it('should return null for null string', () => {
            expect(DataConverters.toDate('null')).toBeNull();
        });

        it('should handle whitespace', () => {
            expect(DataConverters.toDate('  2025-01-15  ')).toBe('2025-01-15');
        });
    });

    describe('formatDate', () => {
        it('should format date with default format', () => {
            // Use UTC date string to avoid timezone issues
            const result = DataConverters.formatDate('2025-01-15');
            expect(result).toContain('2025');
            expect(result).toContain('01');
        });

        it('should handle date strings', () => {
            const result = DataConverters.formatDate('2025-01-15T10:30:00.000Z');
            expect(result).toContain('2025');
        });

        it('should return empty string for null/undefined', () => {
            expect(DataConverters.formatDate(null)).toBe('');
            expect(DataConverters.formatDate(undefined)).toBe('');
        });

        it('should support custom format', () => {
            const result = DataConverters.formatDate('2025-01-15', 'MM/DD/YYYY');
            expect(result).toContain('01');
            expect(result).toContain('2025');
        });
    });

    describe('parseDate', () => {
        it('should parse date string', () => {
            const result = DataConverters.parseDate('2025-01-15');
            expect(result).toEqual(expect.any(Date));
        });

        it('should return null for invalid dates', () => {
            expect(DataConverters.parseDate('invalid')).toBeNull();
            expect(DataConverters.parseDate('')).toBeNull();
        });

        it('should return null for null/undefined', () => {
            expect(DataConverters.parseDate(null)).toBeNull();
            expect(DataConverters.parseDate(undefined)).toBeNull();
        });
    });
});
