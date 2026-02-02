import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { PostStatus, Role } from '@prisma/client';
import { formatDate } from '../utils/dateUtils';
import logger from '../utils/logger';

export class SavedPostController {
    static savePost = asyncHandler(async (req: Request, res: Response) => {
        const { postId } = req.params;
        const userId = req.user!.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, status: true, authorId: true },
        });

        if (!post) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
        }

        const invalidStatuses: PostStatus[] = [PostStatus.DELETED, PostStatus.HIDDEN, PostStatus.PENDING_REVIEW];
        if (invalidStatuses.includes(post.status)) {
            throw new AppError(ErrorCode.FORBIDDEN, 'Cannot save this post');
        }

        if (post.authorId === userId) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot save your own posts');
        }

        const isBlocked = await prisma.blockedUser.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: post.authorId },
                    { blockerId: post.authorId, blockedId: userId },
                ],
            },
        });

        if (isBlocked) {
            throw new AppError(ErrorCode.FORBIDDEN, 'Cannot save this post');
        }

        try {
            await prisma.savedPost.upsert({
                where: {
                    postId_userId: {
                        postId,
                        userId,
                    },
                },
                create: {
                    postId,
                    userId,
                },
                update: {},
            });

            logger.info('Post saved', { userId, postId });

            res.status(200).json({
                success: true,
                message: 'Post saved successfully',
            });
        } catch (error: any) {
            if (error.code === 'P2003') {
                throw new AppError(ErrorCode.NOT_FOUND, 'Post not found');
            }
            logger.error('Unexpected error saving post', { error, userId, postId });
            throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to save post');
        }
    });

    static unsavePost = asyncHandler(async (req: Request, res: Response) => {
        const { postId } = req.params;
        const userId = req.user!.id;

        try {
            await prisma.savedPost.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId,
                    },
                },
            });

            logger.info('Post unsaved', { userId, postId });
        } catch (error: any) {
            if (error.code === 'P2025') {
                logger.info('Post unsave attempted but not found', { userId, postId });
            } else {
                logger.error('Unexpected error unsaving post', { error, userId, postId });
                throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unsave post');
            }
        }

        res.status(200).json({
            success: true,
            message: 'Post unsaved successfully',
        });
    });

    static getSavedPosts = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const page = Math.max(parseInt(req.query.page as string) || 1, 1);
        const cursor = req.query.cursor as string;
        const skip = cursor ? undefined : (page - 1) * limit;

        const where: any = {
            userId,
            post: {
                status: PostStatus.PUBLISHED,
            },
        };

        if (cursor) {
            where.id = {
                lt: cursor,
            };
        }

        const savedPosts = await prisma.savedPost.findMany({
            where,
            take: limit + 1,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                profilePicUrl: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                },
            },
        });

        let hasMore = false;
        let nextCursor: string | null = null;

        if (savedPosts.length > limit) {
            hasMore = true;
            savedPosts.pop();
            const lastItem = savedPosts[savedPosts.length - 1];
            nextCursor = lastItem.id;
        }

        const blockedUsers = await prisma.blockedUser.findMany({
            where: {
                OR: [
                    { blockerId: userId },
                    { blockedId: userId },
                ],
            },
            select: {
                blockerId: true,
                blockedId: true,
            },
        });

        const blockedUserIds = new Set<string>();
        blockedUsers.forEach(block => {
            if (block.blockerId === userId) {
                blockedUserIds.add(block.blockedId);
            } else {
                blockedUserIds.add(block.blockerId);
            }
        });

        const filteredSavedPosts = savedPosts.filter((sp: any) => !blockedUserIds.has(sp.post.authorId));

        const likedPostIds = new Set<string>();
        if (filteredSavedPosts.length > 0) {
            const likes = await prisma.like.findMany({
                where: {
                    userId,
                    postId: { in: filteredSavedPosts.map((sp: any) => sp.post.id) },
                },
                select: { postId: true },
            });
            likes.forEach(l => likedPostIds.add(l.postId));
        }

        const posts = filteredSavedPosts.map((savedPost: any) => {
            const post = savedPost.post;
            const isAuthor = userId === post.authorId;
            const isAdmin = req.user?.role === Role.ADMIN;
            const isUser = req.user?.role === Role.USER;

            return {
                id: post.id,
                title: post.title,
                body: post.body,
                mediaUrls: post.mediaUrls,
                youtubeVideoId: post.youtubeVideoId,
                tags: post.tags,
                isPinned: post.isPinned,
                createdAt: formatDate(post.createdAt),
                savedAt: formatDate(savedPost.createdAt),

                authorId: post.author.id,
                authorName: post.author.name,
                authorProfilePicUrl: post.author.profilePicUrl,

                isLikedByMe: likedPostIds.has(post.id),
                isSavedByMe: true,
                likeCount: post._count.likes,
                commentCount: post._count.comments,

                canEdit: isAuthor,
                canDelete: isAuthor || isAdmin,
                canReport: !isAuthor && isUser,
            };
        });

        const totalCount = cursor ? 0 : await prisma.savedPost.count({
            where: {
                userId,
                post: {
                    status: PostStatus.PUBLISHED,
                },
            },
        });

        logger.info('Fetched saved posts', { userId, count: posts.length });

        const response: any = {
            success: true,
            data: {
                posts,
            },
        };

        if (cursor) {
            response.data.hasMore = hasMore;
            if (nextCursor) {
                response.data.nextCursor = nextCursor;
            }
        } else {
            response.data.pagination = {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            };
        }

        res.status(200).json(response);
    });
}
