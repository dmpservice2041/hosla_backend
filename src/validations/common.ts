import { z } from 'zod';

export const phonePattern = /^[6-9]\d{9}$/;
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const commonSchemas = {
    id: z.string().uuid({ message: 'Invalid UUID format' }),

    pagination: z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    }),

    phone: z.string().regex(phonePattern, { message: 'Invalid Indian phone number' }),

    password: z.string().regex(passwordPattern, {
        message: 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character',
    }),

    email: z.string().email(),
};
