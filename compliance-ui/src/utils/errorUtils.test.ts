import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractErrorMessage, isNetworkError, isServerError } from './errorUtils';

describe('errorUtils', () => {
    describe('extractErrorMessage', () => {
        it('should extract message from string error', () => {
            const error = 'Something went wrong';
            expect(extractErrorMessage(error)).toBe('Something went wrong');
        });

        it('should extract message from Error object', () => {
            const error = new Error('Test error message');
            expect(extractErrorMessage(error)).toBe('Test error message');
        });

        it('should return default message for unknown error', () => {
            expect(extractErrorMessage({})).toBe('An error occurred');
        });

        it('should handle null error', () => {
            expect(extractErrorMessage(null)).toBe('An error occurred');
        });

        it('should handle undefined error', () => {
            expect(extractErrorMessage(undefined)).toBe('An error occurred');
        });
    });

    describe('isNetworkError', () => {
        it('should return false for errors with response', () => {
            const error = { response: { status: 500 } };
            expect(isNetworkError(error)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isNetworkError(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isNetworkError(undefined)).toBe(false);
        });
    });

    describe('isServerError', () => {
        it('should identify 5xx status codes', () => {
            const error = { response: { status: 500 } };
            expect(isServerError(error)).toBe(true);
        });

        it('should identify 503 status', () => {
            const error = { response: { status: 503 } };
            expect(isServerError(error)).toBe(true);
        });

        it('should return false for 4xx status codes', () => {
            const error = { response: { status: 404 } };
            expect(isServerError(error)).toBe(false);
        });

        it('should return false for success status', () => {
            const error = { response: { status: 200 } };
            expect(isServerError(error)).toBe(false);
        });

        it('should return false for no response', () => {
            const error = { message: 'Network error' };
            expect(isServerError(error)).toBe(false);
        });

        it('should handle null', () => {
            expect(isServerError(null)).toBe(false);
        });
    });
});
