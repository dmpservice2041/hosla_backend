import { z } from 'zod';

export const updateProfileSchema = {
    body: z.object({
        name: z.string()
            .min(1, 'Name is required')
            .max(100, 'Name is too long')
            .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
        dateOfBirth: z.string()
            .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date of birth must be in DD-MM-YYYY format'),
        email: z.string()
            .email('Invalid email format')
            .optional(),
        gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
            errorMap: () => ({ message: 'Gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY' }),
        }),
        bio: z.string()
            .max(500, 'Bio cannot exceed 500 characters')
            .optional(),
    }),
};
