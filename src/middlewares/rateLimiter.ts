import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import config from '../config';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
    message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
    const { windowMs, max, keyGenerator, message } = options;
    const windowSeconds = Math.floor(windowMs / 1000);

    return async (req: Request, _res: Response, next: NextFunction) => {
        const key = keyGenerator
            ? `ratelimit:${keyGenerator(req)}`
            : `ratelimit:${req.ip}`;

        try {
            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }

            // if (current > max) {
            //     throw new AppError(
            //         ErrorCode.RATE_LIMITED,
            //         message || 'Too many requests, please try again later',
            //         429
            //     );
            // }

            next();
        } catch (error) {
            if (error instanceof AppError) {
                next(error);
            } else {
                next();
            }
        }
    };
};

export const otpRateLimiter = rateLimiter({
    windowMs: config.rateLimit.otpWindowMinutes * 60 * 1000,
    max: config.rateLimit.otpPerPhone,
    keyGenerator: (req) => `otp:phone:${req.body.phone || 'unknown'}`,
    message: 'Too many OTP requests. Please wait before trying again.',
});

export const otpIpRateLimiter = rateLimiter({
    windowMs: config.rateLimit.otpWindowMinutes * 60 * 1000,
    max: config.rateLimit.otpPerIP,
    keyGenerator: (req) => `otp:ip:${req.ip}`,
    message: 'Too many OTP requests from this IP. Please wait before trying again.',
});

export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 100,
});

export const savePostRateLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => `save:user:${req.user!.id}`,
    message: 'Too many save/unsave requests. Please slow down.',
});
