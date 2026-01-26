import { z } from 'zod';

export const createPostSchema = {
    body: z.object({
        title: z.string().optional(),
        body: z.string().min(1, 'Post body cannot be empty').max(5000, 'Post body too long'),
        mediaUrls: z.array(z.string().url()).optional(),
        isPinned: z.boolean().optional(),
    }),
};

export const updatePostSchema = {
    body: z.object({
        title: z.string().optional(),
        body: z.string().min(1).max(5000).optional(),
        mediaUrls: z.array(z.string().url()).optional(),
        isPinned: z.boolean().optional(),
    }),
};
