/**
 * AppError - Custom error class for application-level errors
 * Follows Open/Closed Principle (OCP)
 * Allows extension without modification of error handling logic
 */

export class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Validation error (400)
     */
    static badRequest(message, details) {
        return new AppError(message, 400, details);
    }

    /**
     * Not found error (404)
     */
    static notFound(message, details) {
        return new AppError(message, 404, details);
    }

    /**
     * Conflict error (409)
     */
    static conflict(message, details) {
        return new AppError(message, 409, details);
    }

    /**
     * Internal server error (500)
     */
    static internalServerError(message, details) {
        return new AppError(message, 500, details);
    }

    /**
     * Database error (500)
     */
    static databaseError(originalError) {
        return new AppError(
            'Database operation failed',
            500,
            {
                originalMessage: originalError.message,
                code: originalError.code
            }
        );
    }

    /**
     * Convert to JSON response
     */
    toJSON() {
        return {
            error: this.message,
            statusCode: this.statusCode,
            ...(this.details && { details: this.details })
        };
    }
}
