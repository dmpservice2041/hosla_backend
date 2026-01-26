import { z } from 'zod';

export const createReportSchema = {
    body: z.object({
        postId: z.string().uuid().optional(),
        commentId: z.string().uuid().optional(),
        reason: z.enum(['ABUSE', 'SPAM', 'FAKE', 'OFFENSIVE']),
    }),
};
