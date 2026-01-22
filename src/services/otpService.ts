import redis from '../config/redis';
import config from '../config';
import logger from '../utils/logger';
import queue from '../jobs/queue';
import { JobType } from '../jobs/worker';

export class OtpService {
    private static readonly OTP_TTL = 300;

    static async generateOtp(phone: string): Promise<string | null> {
        let otp: string;

        if (config.env === 'development' && config.otp.useFixedOtp) {
            otp = config.otp.fixedOtpValue;
            logger.info(`DEV MODE: Using fixed OTP ${otp} for ${phone}`);
        } else {
            otp = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const key = `otp:${phone}`;
        await redis.set(key, otp, 'EX', this.OTP_TTL);

        if (config.env === 'development') {
            logger.info(`DEV MODE: OTP for ${phone} is ${otp}`);
            return otp;
        }

        await queue.add(JobType.SEND_SMS, {
            phone,
            message: `Your Hosla verification code is ${otp}. Valid for 5 minutes.`,
        });

        return null;
    }

    static async verifyOtp(phone: string, otp: string): Promise<boolean> {
        const key = `otp:${phone}`;
        const storedOtp = await redis.get(key);

        if (!storedOtp) {
            return false;
        }

        if (storedOtp === otp) {
            await redis.del(key);
            return true;
        }

        return false;
    }
}
