import { Request, Response, NextFunction } from 'express';
import { Platform } from '../types/platformTypes';
import { Role } from '@prisma/client';
import logger from '../utils/logger';
import config from '../config';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';

export const platformGuard = (allowedPlatforms: Platform[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const currentPlatform = req.context?.platform || Platform.WEB;
        const userRole = req.user?.role;

        if (userRole && (userRole === Role.ADMIN || userRole === Role.STAFF)) {
            if (!allowedPlatforms.includes(currentPlatform)) {

                logger.warn('Platform Guard: Privileged access from unauthorized platform', {
                    userId: req.user?.id,
                    role: userRole,
                    platform: currentPlatform,
                    allowedPlatforms,
                    path: req.path,
                    method: req.method,
                });

                if (config.platform.strictMode) {
                    return next(
                        new AppError(
                            ErrorCode.FORBIDDEN,
                            `Access denied: ${userRole} actions are restricted to ${allowedPlatforms.join(', ')} platform(s)`,
                            403
                        )
                    );
                }
            }
        }

        next();
    };
};
