import { z } from 'zod';

export const userIdParamSchema = z.object({
    userId: z.string().uuid({ message: 'Invalid user ID format' }),
});
