import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { PostStatus, Role } from '@prisma/client';
import logger from '../utils/logger';

export class CommentController {

    static createComment = asyncHandler(async (req: Request, res: Response) => {
        const { postId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user!.id;

        if (!content || content.length > 1000) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Content is required and must be under 1000 characters');
        }


        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { status: true, authorId: true, title: true, body: true }
        });

        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        if (post.status !== PostStatus.PUBLISHED) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot comment on non-published post');
        }


        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { postId: true }
            });

            if (!parent) {
                throw new AppError(ErrorCode.NOT_FOUND, 'Parent comment not found');
            }

            if (parent.postId !== postId) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'Parent comment belongs to a different post');
            }
        }


        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                userId,
                parentId: parentId || null
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        profilePicUrl: true
                    }
                }
            }
        });

        const userName = req.user!.name;


        if (post && post.authorId !== userId) {
            const authorDevices = await prisma.device.findMany({ where: { userId: post.authorId } });
            if (authorDevices.length) {
                const tokens = authorDevices.map(d => d.fcmToken);
                const postTitle = post.title || post.body.substring(0, 50);
                await notificationService.sendMulticast(
                    tokens,
                    'New Comment',
                    `${userName} commented on your post: "${postTitle}"`,
                    { type: 'COMMENT', postId: postId, commentId: comment.id, click_action: 'FLUTTER_NOTIFICATION_CLICK' }
                );
            }
        }


        if (parentId) {
            const parentComment = await prisma.comment.findUnique({ where: { id: parentId }, select: { userId: true } });

            if (parentComment && parentComment.userId !== userId && parentComment.userId !== post.authorId) {
                const parentDevices = await prisma.device.findMany({ where: { userId: parentComment.userId } });
                if (parentDevices.length) {
                    const tokens = parentDevices.map(d => d.fcmToken);
                    await notificationService.sendMulticast(
                        tokens,
                        'New Reply',
                        `${userName} replied to your comment`,
                        { type: 'REPLY', postId: postId, commentId: comment.id, click_action: 'FLUTTER_NOTIFICATION_CLICK' }
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            data: { comment }
        });
    });


    static getCommentsByPost = asyncHandler(async (req: Request, res: Response) => {
        const { postId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const cursorStr = req.query.cursor as string;

        const where: any = {
            postId,
            isDeleted: false
        };

        if (cursorStr) {
            try {
                const cursor = JSON.parse(Buffer.from(cursorStr, 'base64').toString('ascii'));
                where.OR = [
                    { createdAt: { gt: new Date(cursor.createdAt) } },
                    { createdAt: new Date(cursor.createdAt), id: { gt: cursor.id } }
                ];
            } catch {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid cursor');
            }
        }

        const comments = await prisma.comment.findMany({
            where,
            take: limit + 1,
            orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' }
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        profilePicUrl: true
                    }
                }
            }
        });

        let nextCursor: string | null = null;
        if (comments.length > limit) {
            const nextItem = comments.pop();
            if (nextItem) {
                nextCursor = Buffer.from(JSON.stringify({
                    createdAt: nextItem.createdAt.toISOString(),
                    id: nextItem.id
                })).toString('base64');
            }
        }

        res.status(200).json({
            success: true,
            data: {
                comments,
                nextCursor
            }
        });
    });


    static deleteComment = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const comment = await prisma.comment.findUnique({
            where: { id },
            select: { userId: true, isDeleted: true }
        });

        if (!comment || comment.isDeleted) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Comment not found');
        }


        const isAuthor = comment.userId === userId;
        const isAdmin = userRole === Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new AppError(ErrorCode.FORBIDDEN, 'You can only delete your own comments');
        }

        await prisma.comment.update({
            where: { id },
            data: { isDeleted: true }
        });

        logger.info('Comment soft-deleted', {
            commentId: id,
            deletedBy: userId,
            isAuthor
        });

        res.status(200).json({
            success: true,
            message: 'Comment deleted'
        });
    });
}
