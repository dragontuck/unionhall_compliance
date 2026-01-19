/**
 * ValidationUtils - Utility functions for data validation
 * Follows Single Responsibility Principle (SRP)
 * Only handles validation logic
 */

export const ValidationUtils = {
    /**
     * Validate required field
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error message
     * @throws {Error} If value is missing
     */
    required(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            throw new Error(`${fieldName} is required`);
        }
    },

    /**
     * Validate integer value
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error message
     * @throws {Error} If not a valid integer
     */
    isInteger(value, fieldName) {
        if (!Number.isInteger(value)) {
            throw new Error(`${fieldName} must be an integer`);
        }
    },

    /**
     * Validate positive integer
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error message
     * @throws {Error} If not a positive integer
     */
    isPositiveInteger(value, fieldName) {
        this.isInteger(value, fieldName);
        if (value <= 0) {
            throw new Error(`${fieldName} must be positive`);
        }
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Validate date string
     * @param {string} dateStr - Date string to validate
     * @returns {boolean} True if valid date
     */
    isValidDate(dateStr) {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    /**
     * Validate object has required properties
     * @param {Object} obj - Object to validate
     * @param {Array<string>} requiredProps - Required property names
     * @throws {Error} If required properties missing
     */
    hasRequiredProperties(obj, requiredProps) {
        const missing = requiredProps.filter(prop => !obj.hasOwnProperty(prop) || obj[prop] === undefined);
        if (missing.length > 0) {
            throw new Error(`Missing required properties: ${missing.join(', ')}`);
        }
    },

    /**
     * Validate string length
     * @param {string} str - String to validate
     * @param {number} minLength - Minimum length
     * @param {number} maxLength - Maximum length
     * @param {string} fieldName - Field name for error message
     * @throws {Error} If length is invalid
     */
    stringLength(str, minLength, maxLength, fieldName) {
        const len = str ? str.length : 0;
        if (len < minLength || len > maxLength) {
            throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
        }
    }
};
