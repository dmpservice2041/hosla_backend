import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { Role, PostStatus } from '@prisma/client';
import logger from '../utils/logger';
import { TextFilterService } from '../services/textFilterService';
import { getTagPriority, ROLE_PRIORITIES } from '../config/feedConfig';

interface Cursor {
    isPinned: boolean;
    tagPriority: number;
    rolePriority: number;
    publishedAt: string;
    id: string;
}

const encodeCursor = (cursor: Cursor): string => {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
};

const decodeCursor = (cursorStr: string): Cursor | null => {
    try {
        return JSON.parse(Buffer.from(cursorStr, 'base64').toString('ascii'));
    } catch {
        return null;
    }
};

export class PostController {
    static createPost = asyncHandler(async (req: Request, res: Response) => {
        const { title, body, mediaUrls, isPinned, tags } = req.body;
        const user = req.user!;

        if (isPinned && user.role !== Role.ADMIN && user.role !== Role.STAFF) {
            throw new AppError(ErrorCode.FORBIDDEN, 'Only Admin/Staff can pin posts');
        }

        const filterResult = await TextFilterService.checkContent(title + ' ' + body);

        if (!filterResult.isAllowed) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, filterResult.description || 'Content violations found');
        }

        let status = filterResult.status;

        const tagPriority = getTagPriority(tags);
        const rolePriority = ROLE_PRIORITIES[user.role] || 10;

        const post = await prisma.post.create({
            data: {
                authorId: user.id,
                title,
                body,
                mediaUrls: mediaUrls || [],
                isPinned: isPinned || false,
                status,
                tags: tags || [],
                tagPriority,
                rolePriority,
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
        const limit = parseInt(req.query.limit as string) || 20;
        const cursorStr = req.query.cursor as string;
        const page = req.query.page ? parseInt(req.query.page as string) : null;

        const includeHidden = req.query.includeHidden === 'true';
        const isAdmin = req.user?.role === Role.ADMIN;

        const where: any = {
            status: PostStatus.PUBLISHED,
        };

        if (isAdmin && includeHidden) {
            delete where.status;
        }

        let cursorWhere: any = {};

        if (cursorStr) {
            const cursor = decodeCursor(cursorStr);
            if (!cursor) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid cursor');
            }

            cursorWhere = {
                OR: [
                    { isPinned: { lt: cursor.isPinned } },
                    { isPinned: cursor.isPinned, tagPriority: { lt: cursor.tagPriority } },
                    { isPinned: cursor.isPinned, tagPriority: cursor.tagPriority, rolePriority: { lt: cursor.rolePriority } },
                    { isPinned: cursor.isPinned, tagPriority: cursor.tagPriority, rolePriority: cursor.rolePriority, publishedAt: { lt: cursor.publishedAt } },
                    { isPinned: cursor.isPinned, tagPriority: cursor.tagPriority, rolePriority: cursor.rolePriority, publishedAt: cursor.publishedAt, id: { lt: cursor.id } },
                ]
            };

            Object.assign(where, cursorWhere);
        } else if (page) {

        }

        const rawPosts = await prisma.post.findMany({
            where,
            take: limit + 1,
            skip: page ? (page - 1) * limit : undefined,
            orderBy: [
                { isPinned: 'desc' },
                { tagPriority: 'desc' },
                { rolePriority: 'desc' },
                { publishedAt: 'desc' },
                { id: 'desc' },
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

        let nextCursor: string | null = null;

        if (rawPosts.length > limit) {
            const nextItem = rawPosts.pop();

            if (rawPosts.length > 0) {
                const lastPost = rawPosts[rawPosts.length - 1];
                nextCursor = encodeCursor({
                    isPinned: lastPost.isPinned,
                    tagPriority: lastPost.tagPriority,
                    rolePriority: lastPost.rolePriority,
                    publishedAt: lastPost.publishedAt.toISOString(),
                    id: lastPost.id,
                });
            }
        }


        const viewerId = req.user?.id;
        const viewerRole = req.user?.role;
        const likedPostIds = new Set<string>();

        if (viewerId) {
            const likes = await prisma.like.findMany({
                where: {
                    userId: viewerId,
                    postId: { in: rawPosts.map(p => p.id) }
                },
                select: { postId: true }
            });
            likes.forEach(l => likedPostIds.add(l.postId));
        }

        const posts = rawPosts.map(post => ({
            ...post,
            isLikedByMe: likedPostIds.has(post.id),
            likeCount: post._count.likes,
            commentCount: post._count.comments,
            canEdit: viewerId === post.authorId,
            canDelete: viewerId === post.authorId || viewerRole === Role.ADMIN,
            canReport: !!viewerId && viewerId !== post.authorId && viewerRole === Role.USER,
            _count: undefined
        }));

        res.status(200).json({
            success: true,
            data: {
                posts,
                nextCursor,
                pagination: page ? { page, limit } : undefined
            },
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
        const { title, body, mediaUrls, isPinned, tags } = req.body;
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

        if (isPinned !== undefined) {
            if (user.role !== Role.ADMIN && user.role !== Role.STAFF) {
                throw new AppError(ErrorCode.FORBIDDEN, 'Only Admin/Staff can pin posts');
            }
        }

        let newStatus: PostStatus | undefined;

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

        let tagPriority = undefined;
        if (tags) {
            tagPriority = getTagPriority(tags);
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                body,
                mediaUrls,
                tags,
                ...(tagPriority !== undefined && { tagPriority }),
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
