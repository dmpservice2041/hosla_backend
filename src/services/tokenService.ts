import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';
import config from '../config';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';

export interface TokenPayload {
    sub: string;
    role: Role;
    type: 'access' | 'refresh';
}

export class TokenService {
    static async generateAuthTokens(user: User, platform: string = 'web') {
        const accessToken = this.generateToken(
            user.id,
            user.role,
            config.jwt.accessSecret,
            config.jwt.accessExpiresIn,
            'access'
        );

        const refreshExpiresIn = ['android', 'ios'].includes(platform) ? '3650d' : '1d';

        const refreshToken = this.generateToken(
            user.id,
            user.role,
            config.jwt.refreshSecret,
            refreshExpiresIn,
            'refresh'
        );

        const expiresAt = new Date();
        if (['android', 'ios'].includes(platform)) {
            expiresAt.setFullYear(expiresAt.getFullYear() + 10);
        } else {
            expiresAt.setDate(expiresAt.getDate() + 1);
        }

        await this.saveRefreshToken(user.id, refreshToken, expiresAt);

        return {
            access: {
                token: accessToken,
                expires: config.jwt.accessExpiresIn,
            },
            refresh: {
                token: refreshToken,
                expires: refreshExpiresIn,
            },
        };
    }

    private static generateToken(
        userId: string,
        role: Role,
        secret: string,
        expiresIn: string,
        type: 'access' | 'refresh'
    ): string {
        const payload: TokenPayload = {
            sub: userId,
            role,
            type,
        };
        return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
    }

    private static async saveRefreshToken(
        userId: string,
        token: string,
        expiresAt: Date
    ) {
        await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
        } catch (error) {
            throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid access token');
        }
    }

    static async verifyRefreshToken(token: string): Promise<RefreshTokenDoc> {
        try {
            const payload = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            const refreshTokenDoc = await prisma.refreshToken.findUnique({
                where: { token },
                include: { user: true },
            });

            if (!refreshTokenDoc) {
                throw new Error('Token not found');
            }

            return refreshTokenDoc;
        } catch (error) {
            throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid refresh token');
        }
    }

    static async revokeRefreshToken(token: string) {
        await prisma.refreshToken.delete({
            where: { token },
        }).catch(() => { });
    }
}

type RefreshTokenDoc = any;
