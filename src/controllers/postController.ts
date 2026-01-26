import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { Role, PostStatus } from '@prisma/client';
import logger from '../utils/logger';
import { TextFilterService } from '../services/textFilterService';

export class PostController {
    static createPost = asyncHandler(async (req: Request, res: Response) => {
        const { title, body, mediaUrls, isPinned } = req.body;
        const user = req.user!;

        // 1. Pinning Restriction
        if (isPinned && user.role !== Role.ADMIN && user.role !== Role.STAFF) {
            throw new AppError(ErrorCode.FORBIDDEN, 'Only Admin/Staff can pin posts');
        }

        // 2. Initial Status
        // Layer 2 Moderation (Text Filter)
        const filterResult = await TextFilterService.checkContent(title + ' ' + body);

        if (!filterResult.isAllowed) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, filterResult.description || 'Content violations found');
        }

        let status = filterResult.status;

        const post = await prisma.post.create({
            data: {
                authorId: user.id,
                title,
                body,
                mediaUrls: mediaUrls || [],
                isPinned: isPinned || false,
                status,
            },
        });

        logger.info('Post created', {
            postId: post.id,
            authorId: user.id,
            status,
        });

        res.status(201).json({
            success: true,
            data: { post },
        });
    });

    static getFeed = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const includeHidden = req.query.includeHidden === 'true';
        const isAdmin = req.user?.role === Role.ADMIN;

        const where: any = {
            status: PostStatus.PUBLISHED,
        };

        if (isAdmin && includeHidden) {
            delete where.status; // Remove status filter to include all
        }

        const posts = await prisma.post.findMany({
            where,
            take: limit,
            skip: skip,
            orderBy: [
                { isPinned: 'desc' },
                { publishedAt: 'desc' },
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        profilePicUrl: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: { posts },
        });
    });

    static deletePost = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = req.user!;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        const isAuthor = post.authorId === user.id;
        const isAdmin = user.role === Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new AppError(ErrorCode.FORBIDDEN, 'You can only delete your own posts');
        }

        // Soft Delete
        await prisma.post.update({
            where: { id },
            data: { status: PostStatus.DELETED },
        });

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
        });
    });

    static updatePost = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { title, body, mediaUrls, isPinned } = req.body;
        const user = req.user!;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        const isAuthor = post.authorId === user.id;
        const isAdmin = user.role === Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new AppError(ErrorCode.FORBIDDEN, 'You can only edit your own posts');
        }

        // Pinning check on update
        if (isPinned !== undefined) {
            if (user.role !== Role.ADMIN && user.role !== Role.STAFF) {
                throw new AppError(ErrorCode.FORBIDDEN, 'Only Admin/Staff can pin posts');
            }
        }

        let newStatus: PostStatus | undefined;

        // Check content moderation if body/title changed
        if (title || body) {
            const checkText = (title || post.title || '') + ' ' + (body || post.body || '');
            const filterResult = await TextFilterService.checkContent(checkText);

            if (!filterResult.isAllowed) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, filterResult.description || 'Content violations found');
            }

            if (filterResult.status !== PostStatus.PUBLISHED) {
                newStatus = filterResult.status;
            }
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                body,
                mediaUrls,
                ...(isPinned !== undefined && { isPinned }),
                ...(newStatus && { status: newStatus }),
            },
        });

        res.status(200).json({
            success: true,
            data: { post: updatedPost },
        });
    });

    static adminHidePost = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const adminId = req.user!.id;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: { status: PostStatus.HIDDEN },
        });

        logger.warn('Post hidden by Admin', {
            postId: id,
            adminId,
            timestamp: new Date(),
        });

        res.status(200).json({
            success: true,
            message: 'Post hidden successfully',
            data: { post: updatedPost },
        });
    });

    static adminRestorePost = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const adminId = req.user!.id;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: { status: PostStatus.PUBLISHED },
        });

        logger.info('Post restored by Admin', {
            postId: id,
            adminId,
            timestamp: new Date(),
        });

        res.status(200).json({
            success: true,
            message: 'Post restored successfully',
            data: { post: updatedPost },
        });
    });
}
