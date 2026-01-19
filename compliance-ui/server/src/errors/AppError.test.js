/**
 * AppError.test.js - Unit tests for AppError class
 */

import { AppError } from './AppError.js';

describe('AppError', () => {
    describe('constructor', () => {
        it('should create an error with message and status code', () => {
            const error = new AppError('Test error', 400);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.details).toBeNull();
        });

        it('should create an error with details', () => {
            const details = { field: 'email', issue: 'invalid' };
            const error = new AppError('Validation failed', 400, details);
            expect(error.details).toEqual(details);
        });

        it('should have default status code of 500', () => {
            const error = new AppError('Server error');
            expect(error.statusCode).toBe(500);
        });
    });

    describe('static methods', () => {
        it('should create a bad request error', () => {
            const error = AppError.badRequest('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
        });

        it('should create a not found error', () => {
            const error = AppError.notFound('Resource not found');
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Resource not found');
        });

        it('should create a conflict error', () => {
            const error = AppError.conflict('Conflict occurred');
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Conflict occurred');
        });

        it('should create an internal server error', () => {
            const error = AppError.internalServerError('Something went wrong');
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Something went wrong');
        });

        it('should create a database error', () => {
            const originalError = new Error('Query failed');
            const error = AppError.databaseError(originalError);
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Database operation failed');
        });
    });

    describe('error instance checks', () => {
        it('should be instanceof Error', () => {
            const error = new AppError('Test', 400);
            expect(error instanceof Error).toBe(true);
        });

        it('should have correct name property', () => {
            const error = new AppError('Test', 400);
            expect(error.name).toBe('AppError');
        });

        it('should have proper stack trace', () => {
            const error = new AppError('Test', 400);
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('AppError');
        });
    });
});
