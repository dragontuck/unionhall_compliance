/**
 * ErrorHandler.test.js - Unit tests for ErrorHandler
 */

import { errorHandler, asyncHandler } from './ErrorHandler.js';

describe('errorHandler', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 500 status by default', () => {
        const error = new Error('Test error');

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should use custom statusCode if provided', () => {
        const error = new Error('Not found');
        error.statusCode = 404;

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return error message in response', () => {
        const error = new Error('Test error message');

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Test error message'
            })
        );
    });

    it('should return generic error message if not provided', () => {
        const error = {};

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Internal server error'
            })
        );
    });

    it('should include details if provided', () => {
        const error = new Error('Validation error');
        error.statusCode = 400;
        error.details = { field: 'email', reason: 'Invalid format' };

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                details: { field: 'email', reason: 'Invalid format' }
            })
        );
    });

    it('should include validationErrors if provided', () => {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.validationErrors = { email: 'Invalid email format' };

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                validationErrors: { email: 'Invalid email format' }
            })
        );
    });

    it('should handle multiple validation errors', () => {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.validationErrors = {
            email: 'Invalid email format',
            password: 'Password too short',
            username: 'Username already taken'
        };

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                validationErrors: {
                    email: 'Invalid email format',
                    password: 'Password too short',
                    username: 'Username already taken'
                }
            })
        );
    });

    it('should log error to console', () => {
        const error = new Error('Test error');
        error.statusCode = 500;

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(console.error).toHaveBeenCalledWith(
            '[ErrorHandler]',
            expect.objectContaining({
                message: 'Test error',
                statusCode: 500
            })
        );
    });

    it('should log stack trace', () => {
        const error = new Error('Test error');
        error.statusCode = 500;

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(console.error).toHaveBeenCalledWith(
            '[ErrorHandler]',
            expect.objectContaining({
                stack: expect.any(String)
            })
        );
    });

    it('should handle error without message', () => {
        const error = { statusCode: 401 };

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Internal server error'
            })
        );
    });
});

describe('asyncHandler', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {};
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should return a function', () => {
        const handler = jest.fn();
        const wrapped = asyncHandler(handler);

        expect(typeof wrapped).toBe('function');
    });

    it('should call the handler with request, response, and next', () => {
        const handler = jest.fn().mockResolvedValue(undefined);
        const wrapped = asyncHandler(handler);

        wrapped(mockReq, mockRes, mockNext);

        expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should pass errors to next middleware', async () => {
        const testError = new Error('Handler error');
        const handler = jest.fn().mockRejectedValue(testError);
        const wrapped = asyncHandler(handler);

        wrapped(mockReq, mockRes, mockNext);

        await new Promise(resolve => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle successful async operations', () => {
        const handler = jest.fn().mockResolvedValue({ data: 'test' });
        const wrapped = asyncHandler(handler);

        wrapped(mockReq, mockRes, mockNext);

        expect(handler).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Promise rejections', async () => {
        const testError = new Error('Promise rejection');
        const handler = jest.fn().mockImplementation(() => Promise.reject(testError));
        const wrapped = asyncHandler(handler);

        wrapped(mockReq, mockRes, mockNext);

        await new Promise(resolve => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle synchronous function that throws', async () => {
        const testError = new Error('Sync error');
        const handler = jest.fn(async (req, res, next) => {
            throw testError;
        });
        const wrapped = asyncHandler(handler);

        wrapped(mockReq, mockRes, mockNext);

        await new Promise(resolve => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should work with async functions', () => {
        const asyncFn = async (req, res, next) => {
            return { success: true };
        };
        const wrapped = asyncHandler(asyncFn);

        expect(() => wrapped(mockReq, mockRes, mockNext)).not.toThrow();
    });
});
