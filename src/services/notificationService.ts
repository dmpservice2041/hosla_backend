import { firebaseAdmin, isFirebaseInitialized } from '../config/firebase';
import { Message, MulticastMessage } from 'firebase-admin/messaging';
import { addJob, JobType } from '../config/queue';

class NotificationService {
    async sendToDevice(token: string, title: string, body: string, data?: Record<string, string>) {
        if (!isFirebaseInitialized || !firebaseAdmin) {
            console.warn('Firebase is not initialized. Skipping notification.');
            return false;
        }

        const message: Message = {
            notification: {
                title,
                body,
            },
            data,
            token,
        };

        try {
            const response = await firebaseAdmin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
        try {
            await addJob(JobType.SEND_PUSH_NOTIFICATION, {
                tokens,
                title,
                body,
                data
            });
            console.log(`Queued notification for ${tokens.length} devices`);
            return { successCount: tokens.length, failureCount: 0 };
        } catch (error) {
            console.error('Error adding notification to queue:', error);
            return { successCount: 0, failureCount: tokens.length };
        }
    }
}

export const notificationService = new NotificationService();
