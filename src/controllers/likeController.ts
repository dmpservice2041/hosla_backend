import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { PostStatus } from '@prisma/client';
import logger from '../utils/logger';

export class LikeController {

    static likePost = asyncHandler(async (req: Request, res: Response) => {
        const { id: postId } = req.params;
        const userId = req.user!.id;
        const userName = req.user!.name;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true, status: true, title: true, body: true }
        });

        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        if (post.status !== PostStatus.PUBLISHED) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot like a non-published post');
        }

        try {
            await prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });

            logger.info('Post liked', { userId, postId });


            if (post.authorId !== userId) {
                const authorDevices = await prisma.device.findMany({
                    where: { userId: post.authorId }
                });

                if (authorDevices.length > 0) {
                    const tokens = authorDevices.map(d => d.fcmToken);
                    const postTitle = post.title || post.body.substring(0, 50);

                    await notificationService.sendMulticast(
                        tokens,
                        'New Like',
                        `${userName} liked your post: "${postTitle}"`,
                        {
                            type: 'LIKE',
                            postId: postId,
                        }
                    );
                }
            }

        } catch (error: any) {
            if (error.code === 'P2002') {

            } else {
                throw error;
            }
        }

        res.status(200).json({
            success: true,
            liked: true
        });
    });


    static unlikePost = asyncHandler(async (req: Request, res: Response) => {
        const { id: postId } = req.params;
        const userId = req.user!.id;

        try {



            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });

            logger.info('Post unliked', { userId, postId });
        } catch (error: any) {

            if (error.code === 'P2025') {

            } else {
                throw error;
            }
        }

        res.status(200).json({
            success: true,
            liked: false
        });
    });
}
