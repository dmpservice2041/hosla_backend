import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { PostStatus } from '@prisma/client';
import logger from '../utils/logger';

export class LikeController {
    /**
     * Like a post
     * POST /api/posts/:id/like
     */
    static likePost = asyncHandler(async (req: Request, res: Response) => {
        const { id: postId } = req.params;
        const userId = req.user!.id;


        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true, status: true }
        });

        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        if (post.status !== PostStatus.PUBLISHED) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot like a non-published post');
        }


        if (post.authorId === userId) {
            // We return 200/400? Spec said "Reject". 
            // Usually simpler to just return 400 or treat as no-op. 
            // Prompt says: "Reject if user is the author (prevent self-like)"
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'You cannot like your own post');
        }

        try {

            await prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });

            logger.info('Post liked', { userId, postId });
        } catch (error: any) {

            if (error.code === 'P2002') {
                // Already liked, ignore and return success
            } else {
                throw error;
            }
        }

        res.status(200).json({
            success: true,
            liked: true
        });
    });

    /**
     * Unlike a post
     * DELETE /api/posts/:id/like
     */
    static unlikePost = asyncHandler(async (req: Request, res: Response) => {
        const { id: postId } = req.params;
        const userId = req.user!.id;

        try {

            // Using delete which requires unique ID. 
            // In schema, @@unique([postId, userId]) exists.
            // But checking schema again...
            // model Like { ... @@unique([postId, userId]) }
            // So we can use delete with where: { postId_userId: { ... } }

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
                // Not liked, ignore and return success
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
