import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';
import { JobType } from '../config/queue';
import { firebaseAdmin } from '../config/firebase';
import { MulticastMessage } from 'firebase-admin/messaging';

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    'notifications',
    async (job) => {
        logger.info(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case JobType.SEND_PUSH_NOTIFICATION:
                await handlePushNotification(job.data);
                break;

            case JobType.SEND_OTP:
                logger.info('Sending OTP (Mock):', job.data);
                break;

            default:
                logger.warn(`Unknown job type: ${job.name}`);
        }
    },
    {
        connection: connection as any,
        concurrency: 5,
    }
);

async function handlePushNotification(data: any) {
    const { tokens, title, body, data: msgData } = data;

    if (!tokens || !tokens.length) return;

    try {
        const message: MulticastMessage = {
            notification: {
                title,
                body,
            },
            data: msgData,
            tokens,
        };

        const response = await firebaseAdmin!.messaging().sendEachForMulticast(message);

        logger.info(
            `Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
        );


    } catch (error) {
        logger.error('Error in handlePushNotification:', error);
        throw error;
    }
}

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
});

export default worker;
