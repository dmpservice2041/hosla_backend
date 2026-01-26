import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import { ReportReason, PostStatus, ReportStatus } from '@prisma/client';
import logger from '../utils/logger';

const AUTO_HIDE_THRESHOLD = 3;

export class ReportController {
    static createReport = asyncHandler(async (req: Request, res: Response) => {
        const { postId, commentId, reason } = req.body;
        const userId = req.user!.id;

        if (!postId && !commentId) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Either postId or commentId is required');
        }

        if (postId) {
            const post = await prisma.post.findUnique({
                where: { id: postId },
                select: { authorId: true },
            });

            if (post && post.authorId === userId) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'You cannot report your own post');
            }
        }

        const existingReport = await prisma.report.findFirst({
            where: {
                reporterId: userId,
                postId: postId || null,
                commentId: commentId || null,
            },
        });

        if (existingReport) {
            throw new AppError(ErrorCode.CONFLICT, 'You have already reported this content');
        }

        const report = await prisma.report.create({
            data: {
                reporterId: userId,
                postId: postId || null,
                commentId: commentId || null,
                reason: reason as ReportReason,
            },
        });

        logger.info('Content reported', {
            reportId: report.id,
            reporterId: userId,
            reason,
            target: postId ? `Post:${postId}` : `Comment:${commentId}`,
        });

        if (postId) {
            const reportCount = await prisma.report.count({
                where: { postId },
            });

            if (reportCount >= AUTO_HIDE_THRESHOLD) {
                await prisma.post.update({
                    where: { id: postId },
                    data: { status: PostStatus.HIDDEN },
                });

                logger.warn('Post auto-hidden due to reports', {
                    postId,
                    reportCount,
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
        });
    });

    static getReports = asyncHandler(async (req: Request, res: Response) => {

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const reports = await prisma.report.findMany({
            take: limit,
            skip: skip,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: {
                    select: { id: true, name: true, phone: true },
                },
                post: {
                    select: { id: true, title: true, body: true, status: true },
                },
                comment: {
                    select: { id: true, content: true },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: { reports },
        });
    });

    static dismissReport = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const report = await prisma.report.findUnique({
            where: { id },
        });

        if (!report) {
            throw new AppError(ErrorCode.NOT_FOUND, 'Report not found');
        }

        await prisma.report.update({
            where: { id },
            data: { status: ReportStatus.DISMISSED }, 
        });

        res.status(200).json({
            success: true,
            message: 'Report dismissed',
        });
    });
}
