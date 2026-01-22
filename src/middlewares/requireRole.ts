import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';

export const requireRole = (roles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(ErrorCode.FORBIDDEN, 'Insufficient permissions', 403));
        }

        next();
    };
};
