import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import prisma from '../config/database';
import { User } from '@prisma/client';
import { Platform } from '../types/platformTypes';

declare module 'express-serve-static-core' {
    interface Request {
        user?: User;
        context?: {
            platform: Platform;
        };
    }
}

export const verifyToken = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(ErrorCode.UNAUTHORIZED, 'Please authenticate', 401);
        }

        const token = authHeader.split(' ')[1];
        const payload = TokenService.verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || user.isDeleted) {
            throw new AppError(ErrorCode.UNAUTHORIZED, 'User not found or deactivated', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export const verifyTokenOptional = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }
        }

        const token = authHeader.split(' ')[1];

        // If token invalid, we can either throw or ignore. 
        // Strict "Optional" typically means "If provided, must be valid. If missing, ok".
        // But for Feed, maybe we just ignore invalid tokens and treat as anon? 
        // Standard is: If header sent, verify it. Catch format errors.

        try {
            const payload = TokenService.verifyAccessToken(token);
            const user = await prisma.user.findUnique({ where: { id: payload.sub } });

            if (user && !user.isDeleted) {
                req.user = user;
            }
        } catch (e) {
            // Invalid token -> Proceed as anonymous? Or 401?
            // "Graceful defaults" implies functioning even if auth fails, OR just functioning if auth is missing.
            // Usually if I send a bad token, I want to know (401). If I send NO token, I am anon.
            // I will implement: No header -> Anon. Header -> Must be valid.
            throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid token', 401);
        }

        next();
    } catch (error) {
        next(error);
    }
};
