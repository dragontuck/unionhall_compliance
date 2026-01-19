/**
 * ValidationUtils.test.js - Unit tests for ValidationUtils
 */

import { ValidationUtils } from './ValidationUtils.js';

describe('ValidationUtils', () => {
    describe('required', () => {
        it('should allow valid string', () => {
            expect(() => ValidationUtils.required('value', 'name')).not.toThrow();
        });

        it('should allow zero', () => {
            expect(() => ValidationUtils.required(0, 'count')).not.toThrow();
        });

        it('should allow false', () => {
            expect(() => ValidationUtils.required(false, 'flag')).not.toThrow();
        });

        it('should throw for undefined', () => {
            expect(() => ValidationUtils.required(undefined, 'name')).toThrow('name is required');
        });

        it('should throw for null', () => {
            expect(() => ValidationUtils.required(null, 'name')).toThrow('name is required');
        });

        it('should throw for empty string', () => {
            expect(() => ValidationUtils.required('', 'name')).toThrow('name is required');
        });

        it('should include field name in error', () => {
            expect(() => ValidationUtils.required(null, 'email')).toThrow('email is required');
        });
    });

    describe('isInteger', () => {
        it('should allow integer values', () => {
            expect(() => ValidationUtils.isInteger(42, 'count')).not.toThrow();
            expect(() => ValidationUtils.isInteger(0, 'count')).not.toThrow();
            expect(() => ValidationUtils.isInteger(-10, 'count')).not.toThrow();
        });

        it('should reject decimal numbers', () => {
            expect(() => ValidationUtils.isInteger(3.14, 'value')).toThrow('value must be an integer');
        });

        it('should reject strings', () => {
            expect(() => ValidationUtils.isInteger('123', 'id')).toThrow('id must be an integer');
        });

        it('should reject null', () => {
            expect(() => ValidationUtils.isInteger(null, 'id')).toThrow('id must be an integer');
        });

        it('should reject NaN', () => {
            expect(() => ValidationUtils.isInteger(NaN, 'value')).toThrow('value must be an integer');
        });
    });

    describe('isPositiveInteger', () => {
        it('should allow positive integers', () => {
            expect(() => ValidationUtils.isPositiveInteger(1, 'count')).not.toThrow();
            expect(() => ValidationUtils.isPositiveInteger(100, 'count')).not.toThrow();
        });

        it('should reject zero', () => {
            expect(() => ValidationUtils.isPositiveInteger(0, 'count')).toThrow('count must be positive');
        });

        it('should reject negative integers', () => {
            expect(() => ValidationUtils.isPositiveInteger(-5, 'count')).toThrow('count must be positive');
        });

        it('should reject decimal numbers', () => {
            expect(() => ValidationUtils.isPositiveInteger(3.14, 'value')).toThrow('value must be an integer');
        });

        it('should reject non-integers first', () => {
            expect(() => ValidationUtils.isPositiveInteger(3.14, 'value')).toThrow('value must be an integer');
        });
    });

    describe('isValidEmail', () => {
        it('should accept valid emails', () => {
            expect(ValidationUtils.isValidEmail('user@example.com')).toBe(true);
            expect(ValidationUtils.isValidEmail('john.doe@company.co.uk')).toBe(true);
            expect(ValidationUtils.isValidEmail('test123@test-domain.org')).toBe(true);
        });

        it('should reject emails without @', () => {
            expect(ValidationUtils.isValidEmail('userexample.com')).toBe(false);
        });

        it('should reject emails without domain', () => {
            expect(ValidationUtils.isValidEmail('user@')).toBe(false);
        });

        it('should reject emails without local part', () => {
            expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
        });

        it('should reject emails with spaces', () => {
            expect(ValidationUtils.isValidEmail('user @example.com')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(ValidationUtils.isValidEmail('')).toBe(false);
        });

        it('should reject emails without TLD', () => {
            expect(ValidationUtils.isValidEmail('user@domain')).toBe(false);
        });
    });

    describe('isValidDate', () => {
        it('should accept valid ISO date strings', () => {
            expect(ValidationUtils.isValidDate('2025-01-15')).toBe(true);
            expect(ValidationUtils.isValidDate('2025-01-15T10:30:00')).toBe(true);
        });

        it('should accept valid date formats', () => {
            expect(ValidationUtils.isValidDate('01/15/2025')).toBe(true);
            expect(ValidationUtils.isValidDate('January 15, 2025')).toBe(true);
        });

        it('should accept Date objects', () => {
            expect(ValidationUtils.isValidDate(new Date().toString())).toBe(true);
        });

        it('should reject invalid date strings', () => {
            expect(ValidationUtils.isValidDate('not-a-date')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(ValidationUtils.isValidDate('')).toBe(false);
        });

        it('should reject invalid dates', () => {
            expect(ValidationUtils.isValidDate('2025-13-45')).toBe(false);
        });
    });

    describe('hasRequiredProperties', () => {
        it('should accept object with all required properties', () => {
            const obj = { name: 'John', email: 'john@example.com', age: 30 };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email'])).not.toThrow();
        });

        it('should throw when required property is missing', () => {
            const obj = { name: 'John' };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email']))
                .toThrow('Missing required properties: email');
        });

        it('should throw when multiple properties are missing', () => {
            const obj = { name: 'John' };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email', 'age']))
                .toThrow('Missing required properties: email, age');
        });

        it('should reject undefined property values', () => {
            const obj = { name: 'John', email: undefined };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email']))
                .toThrow('Missing required properties: email');
        });

        it('should accept null property values', () => {
            const obj = { name: 'John', email: null };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email'])).not.toThrow();
        });

        it('should accept empty string property', () => {
            const obj = { name: 'John', email: '' };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'email'])).not.toThrow();
        });

        it('should accept zero property', () => {
            const obj = { name: 'John', count: 0 };
            expect(() => ValidationUtils.hasRequiredProperties(obj, ['name', 'count'])).not.toThrow();
        });
    });

    describe('stringLength', () => {
        it('should accept string within length bounds', () => {
            expect(() => ValidationUtils.stringLength('hello', 3, 10, 'name')).not.toThrow();
        });

        it('should accept string at min length', () => {
            expect(() => ValidationUtils.stringLength('abc', 3, 10, 'name')).not.toThrow();
        });

        it('should accept string at max length', () => {
            expect(() => ValidationUtils.stringLength('1234567890', 3, 10, 'name')).not.toThrow();
        });

        it('should reject string too short', () => {
            expect(() => ValidationUtils.stringLength('ab', 3, 10, 'name'))
                .toThrow('name must be between 3 and 10 characters');
        });

        it('should reject string too long', () => {
            expect(() => ValidationUtils.stringLength('12345678901', 3, 10, 'name'))
                .toThrow('name must be between 3 and 10 characters');
        });

        it('should treat null as empty string', () => {
            expect(() => ValidationUtils.stringLength(null, 0, 10, 'value')).not.toThrow();
        });

        it('should reject empty string when min length is greater than 0', () => {
            expect(() => ValidationUtils.stringLength('', 1, 10, 'name'))
                .toThrow('name must be between 1 and 10 characters');
        });

        it('should accept empty string when min is 0', () => {
            expect(() => ValidationUtils.stringLength('', 0, 10, 'name')).not.toThrow();
        });

        it('should include field name in error message', () => {
            expect(() => ValidationUtils.stringLength('x', 5, 10, 'username'))
                .toThrow('username must be between 5 and 10 characters');
        });
    });
});
