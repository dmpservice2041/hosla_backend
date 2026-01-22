import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import logger from '../utils/logger';

interface ValidationSchema {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}

export const validate = (schema: ValidationSchema) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                logger.error(`Validation Failed. Body: ${JSON.stringify(req.body)}, Errors: ${JSON.stringify(details)}`);
                next(new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, { errors: details }));
            } else {
                next(error);
            }
        }
    };
};
