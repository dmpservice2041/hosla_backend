import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

export enum JobType {
    SEND_EMAIL = 'SEND_EMAIL',
    SEND_SMS = 'SEND_SMS',
    COMPRESS_IMAGE = 'COMPRESS_IMAGE',
    GENERATE_THUMBNAIL = 'GENERATE_THUMBNAIL',
    SEND_NOTIFICATION = 'SEND_NOTIFICATION',
}

const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    'default-queue',
    async (job) => {
        logger.info(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case JobType.SEND_SMS:
                logger.info('Sending SMS:', job.data);
                break;

            case JobType.COMPRESS_IMAGE:
                logger.info('Compressing image:', job.data);
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

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
});

export default worker;
