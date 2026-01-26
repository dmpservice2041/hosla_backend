import { Request, Response } from 'express';
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
            select: { status: true }
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

        // 3. Create Comment
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

        res.status(201).json({
            success: true,
            data: { comment }
        });
    });


    static getCommentsByPost = asyncHandler(async (req: Request, res: Response) => {
        const { postId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                isDeleted: false
            },
            take: limit,
            skip,
            orderBy: { createdAt: 'asc' },
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

        res.status(200).json({
            success: true,
            data: { comments }
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
