import { Queue } from 'bullmq';
import config from '../config';
import logger from '../utils/logger';

import IORedis from 'ioredis';
const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

const defaultQueue = new Queue('default-queue', {
    connection: connection as any,
});

defaultQueue.on('error', (err) => {
    logger.error('Queue error:', err);
});

export default defaultQueue;
