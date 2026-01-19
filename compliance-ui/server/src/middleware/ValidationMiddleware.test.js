/**
 * ValidationMiddleware.test.js - Unit tests for validation middleware
 */

import { validateParams, validateBody, validateQuery } from '../../src/middleware/ValidationMiddleware.js';
import { AppError } from '../../src/errors/AppError.js';

describe('ValidationMiddleware', () => {
    describe('validateParams', () => {
        let req, res, next;

        beforeEach(() => {
            req = { params: {} };
            res = {};
            next = jest.fn();
        });

        it('should pass validation for valid integer param', () => {
            req.params.id = '123';
            const middleware = validateParams({ id: { type: 'integer' } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should fail validation for non-integer param', () => {
            req.params.id = 'abc';
            const middleware = validateParams({ id: { type: 'integer' } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should pass when param is not required and missing', () => {
            const middleware = validateParams({ id: { type: 'integer', required: false } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('validateBody', () => {
        let req, res, next;

        beforeEach(() => {
            req = { body: {} };
            res = {};
            next = jest.fn();
        });

        it('should pass validation for valid body', () => {
            req.body.email = 'test@example.com';
            const middleware = validateBody({ email: { type: 'string' } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should fail validation for missing required field', () => {
            const middleware = validateBody({ email: { type: 'string', required: true } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should validate number types correctly', () => {
            req.body.age = 'twenty-five';
            const middleware = validateBody({ age: { type: 'number' } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should validate minLength constraint', () => {
            req.body.password = 'abc';
            const middleware = validateBody({ password: { type: 'string', minLength: 8 } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('validateQuery', () => {
        let req, res, next;

        beforeEach(() => {
            req = { query: {} };
            res = {};
            next = jest.fn();
        });

        it('should pass validation for optional query params', () => {
            const middleware = validateQuery({ filter: { required: false } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should fail validation for missing required query param', () => {
            const middleware = validateQuery({ filter: { required: true } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should pass when required query param is present', () => {
            req.query.filter = 'active';
            const middleware = validateQuery({ filter: { required: true } });
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
