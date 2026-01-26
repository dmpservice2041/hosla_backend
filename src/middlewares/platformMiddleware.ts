import { Request, Response, NextFunction } from 'express';
import { Platform, normalizePlatform } from '../types/platformTypes';
import logger from '../utils/logger';
import config from '../config';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';

declare module 'express-serve-static-core' {
    interface Request {
        context?: {
            platform: Platform;
        };
    }
}

export const platformMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    try {
        let resolvedPlatform: Platform;
        let source: 'header' | 'body' | 'default' = 'default';
        let fallbackUsed = false;

        const headerPlatform = req.headers['x-client-platform'] as string | undefined;
        const bodyPlatform = req.body?.device?.platform as string | undefined;

        if (config.platform.strictMode) {
            if (!headerPlatform) {
                logger.warn('Strict mode enforcement: Rejected request missing X-Client-Platform header', {
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                });
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'X-Client-Platform header is required', 400);
            }
        }

        if (headerPlatform) {
            resolvedPlatform = normalizePlatform(headerPlatform);
            source = 'header';

            if (bodyPlatform && normalizePlatform(bodyPlatform) !== resolvedPlatform) {
                logger.warn('Platform mismatch detected', {
                    headerPlatform: resolvedPlatform,
                    bodyPlatform: normalizePlatform(bodyPlatform),
                    path: req.path,
                    method: req.method,
                    headerUsed: true,
                    fallbackUsed: false,
                });
            }
        } else if (bodyPlatform) {
            resolvedPlatform = normalizePlatform(bodyPlatform);
            source = 'body';
            fallbackUsed = true;

            logger.warn('Legacy platform fallback used - X-Client-Platform header missing', {
                platform: resolvedPlatform,
                path: req.path,
                method: req.method,
                headerUsed: false,
                fallbackUsed: true,
            });
        } else {
            resolvedPlatform = Platform.WEB;
            source = 'default';
        }

        req.context = {
            platform: resolvedPlatform,
        };

        logger.debug('Platform resolved', {
            platform: resolvedPlatform,
            source,
            path: req.path,
            method: req.method,
            headerUsed: source === 'header',
            fallbackUsed,
        });

        next();
    } catch (error) {
        if (!(error instanceof AppError)) {
            logger.error('Error in platformMiddleware', { error });
        }
        next(error);
    }
};
