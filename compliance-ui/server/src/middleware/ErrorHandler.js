/**
 * ErrorHandler - Express middleware for error handling
 * Follows Single Responsibility Principle (SRP)
 * Centralizes all error handling logic
 */

export function errorHandler(err, req, res, next) {
    console.error('[ErrorHandler]', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack
    });

    // Default error response
    const statusCode = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal server error'
    };

    if (err.details) {
        response.details = err.details;
    }

    // Add validation errors if available
    if (err.validationErrors) {
        response.validationErrors = err.validationErrors;
    }

    res.status(statusCode).json(response);
}

/**
 * AsyncHandler - Wrapper for async route handlers
 * Follows Don't Repeat Yourself (DRY) Principle
 * Eliminates repetitive try-catch in route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
