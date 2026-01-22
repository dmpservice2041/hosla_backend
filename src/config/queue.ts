import { Queue, Worker, Job } from 'bullmq';
import redis from './redis';

export enum JobType {
    SEND_OTP = 'SEND_OTP',
    SEND_PUSH_NOTIFICATION = 'SEND_PUSH_NOTIFICATION',
    COMPRESS_IMAGE = 'COMPRESS_IMAGE',
    GENERATE_THUMBNAIL = 'GENERATE_THUMBNAIL',
    PUBLISH_SCHEDULED_POST = 'PUBLISH_SCHEDULED_POST',
    SEND_EVENT_REMINDER = 'SEND_EVENT_REMINDER',
    AGGREGATE_ANALYTICS = 'AGGREGATE_ANALYTICS',
}

const connection = {
    host: redis.options.host || 'localhost',
    port: redis.options.port || 6379,
};

export const notificationQueue = new Queue('notifications', { connection });
export const mediaQueue = new Queue('media-processing', { connection });
export const scheduledQueue = new Queue('scheduled-tasks', { connection });
export const analyticsQueue = new Queue('analytics', { connection });

export const getQueue = (jobType: JobType): Queue => {
    switch (jobType) {
        case JobType.SEND_OTP:
        case JobType.SEND_PUSH_NOTIFICATION:
            return notificationQueue;
        case JobType.COMPRESS_IMAGE:
        case JobType.GENERATE_THUMBNAIL:
            return mediaQueue;
        case JobType.PUBLISH_SCHEDULED_POST:
        case JobType.SEND_EVENT_REMINDER:
            return scheduledQueue;
        case JobType.AGGREGATE_ANALYTICS:
            return analyticsQueue;
        default:
            return notificationQueue;
    }
};

export const addJob = async <T>(
    jobType: JobType,
    data: T,
    options?: { delay?: number; priority?: number }
) => {
    const queue = getQueue(jobType);
    return queue.add(jobType, data, {
        delay: options?.delay,
        priority: options?.priority,
        removeOnComplete: true,
        removeOnFail: 100,
    });
};

export { Job, Worker };
