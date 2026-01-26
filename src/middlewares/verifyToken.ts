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
