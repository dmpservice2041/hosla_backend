import { z } from 'zod';

export const postIdParamSchema = z.object({
    postId: z.string().uuid({ message: 'Invalid post ID format' }),
});
