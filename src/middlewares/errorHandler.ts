import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import logger from '../utils/logger';
import config from '../config';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error(err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };

        if (prismaError.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: {
                    code: ErrorCode.CONFLICT,
                    message: `Duplicate value for ${prismaError.meta?.target?.join(', ')}`,
                },
            });
        }

        if (prismaError.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: {
                    code: ErrorCode.NOT_FOUND,
                    message: 'Record not found',
                },
            });
        }
    }

    if (err.name === 'ZodError') {
        const zodError = err as unknown as { errors: Array<{ path: string[]; message: string }> };
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Validation failed',
                details: zodError.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: ErrorCode.INVALID_TOKEN,
                message: 'Invalid token',
            },
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: ErrorCode.TOKEN_EXPIRED,
                message: 'Token has expired',
            },
        });
    }

    const statusCode = 500;
    const message = config.env === 'development' ? err.message : 'Internal server error';

    return res.status(statusCode).json({
        success: false,
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message,
            ...(config.env === 'development' && { stack: err.stack }),
        },
    });
};
