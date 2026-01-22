import { Response } from 'express';

interface SuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
    meta?: SuccessResponse<T>['meta']
) => {
    const response: SuccessResponse<T> = {
        success: true,
        data,
        ...(message && { message }),
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string) => {
    return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response) => {
    return res.status(204).send();
};

export const sendError = (
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
) => {
    const response: ErrorResponse = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
    };
    return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
) => {
    return sendSuccess(res, data, undefined, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
};
