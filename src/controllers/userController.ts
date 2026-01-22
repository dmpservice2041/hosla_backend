import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { UploadService } from '../services/uploadService';
import { Gender } from '@prisma/client';

export class UserController {

    static updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) {
            throw new AppError(ErrorCode.UNAUTHORIZED, 'User authentication failed');
        }

        const { name, dateOfBirth, email, gender, bio } = req.body;

        const [day, month, year] = dateOfBirth.split('-').map(Number);
        const dobDate = new Date(year, month - 1, day);

        if (isNaN(dobDate.getTime())) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid date of birth');
        }

        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: userId },
                },
            });

            if (existingUser) {
                throw new AppError(ErrorCode.USER_ALREADY_EXISTS, 'Email is already in use');
            }
        }

        let profilePicUrl: string | undefined;
        if (req.file) {
            const processedFilename = await UploadService.processImage(req.file, {
                quality: 85,
                width: 400,
            });
            profilePicUrl = `/uploads/${processedFilename}`;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                dateOfBirth: dobDate,
                email: email || null,
                gender: gender as Gender,
                bio: bio || null,
                ...(profilePicUrl && { profilePicUrl }),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser,
            },
        });
    });

    static getProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError(ErrorCode.USER_NOT_FOUND, 'User not found');
        }

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    });
}
