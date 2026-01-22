import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { OtpService } from '../services/otpService';
import { TokenService } from '../services/tokenService';
import prisma from '../config/database';
import { asyncHandler } from '../middlewares/asyncHandler';
import config from '../config';

export class AuthController {
    static requestOtp = asyncHandler(async (req: Request, res: Response) => {
        const { phone } = req.body;

        const otp = await OtpService.generateOtp(phone);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: config.env === 'development' ? { otp } : undefined,
        });
    });

    static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
        const { phone, otp, device } = req.body;

        const isValid = await OtpService.verifyOtp(phone, otp);
        if (!isValid) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid or expired OTP', 400);
        }

        let user = await prisma.user.findUnique({ where: { phone } });
        let isNewUser = false;

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone,
                    name: '',
                },
            });
            isNewUser = true;
        }

        if (user.isDeleted) {
            throw new AppError(ErrorCode.FORBIDDEN, 'Account is deleted. Please contact support.', 403);
        }

        const tokens = await TokenService.generateAuthTokens(user);

        if (device) {
            await prisma.device.deleteMany({
                where: { fcmToken: device.fcmToken },
            });

            await prisma.device.create({
                data: {
                    userId: user.id,
                    fcmToken: device.fcmToken,
                    platform: device.platform,
                    model: device.model,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user,
                tokens,
                isNewUser,
            },
        });
    });

    static refreshTokens = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        const refreshTokenDoc = await TokenService.verifyRefreshToken(refreshToken);
        const user = refreshTokenDoc.user;

        await TokenService.revokeRefreshToken(refreshToken);
        const tokens = await TokenService.generateAuthTokens(user);

        res.status(200).json({
            success: true,
            data: {
                tokens,
            },
        });
    });

    static logout = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await TokenService.revokeRefreshToken(refreshToken);
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    });
}
