import { ErrorCode, ErrorMessages } from './errorCodes';

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCode,
        message?: string,
        statusCode?: number,
        details?: Record<string, unknown>
    ) {
        super(message || ErrorMessages[code]);
        this.code = code;
        this.statusCode = statusCode || AppError.getDefaultStatusCode(code);
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }

    private static getDefaultStatusCode(code: ErrorCode): number {
        if (code.includes('UNAUTHORIZED') || code.includes('TOKEN') || code.includes('OTP')) {
            if (code === ErrorCode.FORBIDDEN || code === ErrorCode.INSUFFICIENT_PERMISSIONS) {
                return 403;
            }
            return 401;
        }
        if (code.includes('FORBIDDEN') || code.includes('PERMISSION')) return 403;
        if (code.includes('NOT_FOUND')) return 404;
        if (code.includes('CONFLICT') || code.includes('ALREADY')) return 409;
        if (code.includes('VALIDATION') || code.includes('INVALID') || code.includes('MISSING')) return 400;
        if (code.includes('RATE')) return 429;
        if (code.includes('INTERNAL') || code.includes('DATABASE') || code.includes('REDIS')) return 500;
        return 400;
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details && { details: this.details }),
            },
        };
    }
}

export const unauthorized = (message?: string) =>
    new AppError(ErrorCode.UNAUTHORIZED, message);

export const forbidden = (message?: string) =>
    new AppError(ErrorCode.FORBIDDEN, message);

export const notFound = (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`);

export const validationError = (details: Record<string, unknown>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, details);

export const rateLimited = (message?: string) =>
    new AppError(ErrorCode.RATE_LIMITED, message);

export const internalError = (message?: string) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message);
