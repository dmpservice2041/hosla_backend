import { z } from 'zod';
import { commonSchemas } from './common';

export const requestOtpSchema = {
    body: z.object({
        phone: commonSchemas.phone,
    }),
};

export const verifyOtpSchema = {
    body: z.object({
        phone: commonSchemas.phone,
        otp: z.string().length(6, 'OTP must be 6 digits'),
        device: z.object({
            fcmToken: z.string(),
            platform: z.enum(['ANDROID', 'IOS', 'WEB', 'android', 'ios', 'web']),
            model: z.string().optional(),
        }).optional(),
    }),
};

export const refreshTokenSchema = {
    body: z.object({
        refreshToken: z.string(),
    }),
};
