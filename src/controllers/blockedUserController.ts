import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import logger from '../utils/logger';

export class BlockedUserController {
    static blockUser = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const blockerId = req.user!.id;

        if (blockerId === userId) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'You cannot block yourself');
        }

        const userToBlock = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToBlock) {
            throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
        }

        const existingBlock = await prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId: userId,
                },
            },
        });

        if (existingBlock) {
            return res.status(200).json({
                success: true,
                message: 'User already blocked',
            });
        }

        await prisma.blockedUser.create({
            data: {
                blockerId,
                blockedId: userId,
            },
        });

        logger.info('User blocked', { blockerId, blockedId: userId });

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
        });
    });

    static unblockUser = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const blockerId = req.user!.id;

        try {
            await prisma.blockedUser.delete({
                where: {
                    blockerId_blockedId: {
                        blockerId,
                        blockedId: userId,
                    },
                },
            });

            logger.info('User unblocked', { blockerId, blockedId: userId });

            res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(200).json({
                    success: true,
                    message: 'User was not blocked',
                });
            }
            logger.error('Unexpected error unblocking user', { error, blockerId, blockedId: userId });
            throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unblock user');
        }
    });

    static getBlockedUsers = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const page = Math.max(parseInt(req.query.page as string) || 1, 1);
        const skip = (page - 1) * limit;

        const blockedUsers = await prisma.blockedUser.findMany({
            where: {
                blockerId: userId,
            },
            take: limit,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                blocked: {
                    select: {
                        id: true,
                        name: true,
                        profilePicUrl: true,
                    },
                },
            },
        });

        const totalCount = await prisma.blockedUser.count({
            where: { blockerId: userId },
        });

        const users = blockedUsers.map(block => ({
            id: block.blocked.id,
            name: block.blocked.name,
            profilePicUrl: block.blocked.profilePicUrl,
            blockedAt: block.createdAt.toISOString(),
        }));

        logger.info('Fetched blocked users', { userId, count: users.length });

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            },
        });
    });
}
