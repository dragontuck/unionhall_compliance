/**
 * ValidationMiddleware - Express middleware for request validation
 * Follows Single Responsibility Principle (SRP)
 * Validates incoming requests before reaching handlers
 */

import { AppError } from '../errors/AppError.js';

/**
 * Validate query parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const errors = {};

        for (const [key, validator] of Object.entries(schema)) {
            const value = req.query[key];
            if (validator.required && !value) {
                errors[key] = `${key} is required`;
            }
        }

        if (Object.keys(errors).length > 0) {
            return next(AppError.badRequest('Query validation failed', errors));
        }

        next();
    };
}

/**
 * Validate request body
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const errors = {};

        for (const [key, validator] of Object.entries(schema)) {
            const value = req.body[key];

            if (validator.required && (value === undefined || value === null || value === '')) {
                errors[key] = `${key} is required`;
                continue;
            }

            if (validator.type === 'number' && value && isNaN(value)) {
                errors[key] = `${key} must be a number`;
            } else if (validator.type === 'integer' && value && !Number.isInteger(Number(value))) {
                errors[key] = `${key} must be an integer`;
            } else if (validator.minLength && value && value.length < validator.minLength) {
                errors[key] = `${key} must be at least ${validator.minLength} characters`;
            } else if (validator.maxLength && value && value.length > validator.maxLength) {
                errors[key] = `${key} must be at most ${validator.maxLength} characters`;
            }
        }

        if (Object.keys(errors).length > 0) {
            return next(AppError.badRequest('Body validation failed', errors));
        }

        next();
    };
}

/**
 * Validate route parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
    return (req, res, next) => {
        const errors = {};

        for (const [key, validator] of Object.entries(schema)) {
            const value = req.params[key];

            if (validator.type === 'integer') {
                const numValue = Number(value);
                if (isNaN(numValue) || !Number.isInteger(numValue)) {
                    errors[key] = `${key} must be an integer`;
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            return next(AppError.badRequest('Parameter validation failed', errors));
        }

        next();
    };
}
