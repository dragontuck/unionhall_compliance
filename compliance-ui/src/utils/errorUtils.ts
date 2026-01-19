/**
 * Error utilities
 * Single Responsibility Principle: Only handles error transformation
 */

export interface ErrorResponse {
    response?: {
        data?: {
            error?: string;
        };
    };
    message?: string;
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
    if (typeof error === 'string') return error;

    const err = error as ErrorResponse;

    if (err?.response?.data?.error) {
        return err.response.data.error;
    }

    if (err?.message) {
        return err.message;
    }

    return defaultMessage;
}

/**
 * Determines if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    const err = error as ErrorResponse;
    return err?.response === undefined;
}

/**
 * Determines if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
    const err = error as ErrorResponse;
    return err?.response?.data?.error !== undefined;
}
