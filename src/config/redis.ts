import Redis from 'ioredis';
import config from './index';
import logger from '../utils/logger';

const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
        if (times > 3) {
            return null;
        }
        return Math.min(times * 200, 2000);
    },
});

redis.on('connect', () => {
    logger.info('Redis connected');
});

redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
});

export default redis;
