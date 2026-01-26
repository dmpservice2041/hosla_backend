import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { PostStatus } from '@prisma/client';

export class AnalyticsController {
    static getSafetyStats = asyncHandler(async (_req: Request, res: Response) => {
        const [
            totalPosts,
            hiddenPosts,
            pendingPosts,
            totalReports
        ] = await Promise.all([
            prisma.post.count(),
            prisma.post.count({ where: { status: PostStatus.HIDDEN } }),
            prisma.post.count({ where: { status: PostStatus.PENDING_REVIEW } }),
            prisma.report.count(),
        ]);

        const recentReports = await prisma.report.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { name: true } },
                post: { select: { title: true } }
            }
        });

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalPosts,
                    hiddenPosts,
                    pendingPosts,
                    totalReports,
                },
                recentReports
            },
        });
    });
}
