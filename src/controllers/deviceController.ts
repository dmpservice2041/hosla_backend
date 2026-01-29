import { Request, Response } from 'express';
import prisma from '../config/database';

export class DeviceController {
    async registerDevice(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { fcmToken, platform, model } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (!fcmToken || !platform) {
                return res.status(400).json({ success: false, message: 'FCM Token and Platform are required' });
            }


            const existingDevice = await prisma.device.findFirst({
                where: { fcmToken },
            });

            if (existingDevice) {

                const updatedDevice = await prisma.device.update({
                    where: { id: existingDevice.id },
                    data: {
                        userId,
                        platform,
                        model,
                        lastActive: new Date(),
                    },
                });
                return res.status(200).json({ success: true, data: updatedDevice });
            }


            const newDevice = await prisma.device.create({
                data: {
                    userId,
                    fcmToken,
                    platform,
                    model,
                },
            });

            res.status(201).json({ success: true, data: newDevice });
        } catch (error) {
            console.error('Error registering device:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async unregisterDevice(req: Request, res: Response) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }


            await prisma.device.deleteMany({
                where: { fcmToken: token },
            });

            res.status(200).json({ success: true, message: 'Device unregistered successfully' });
        } catch (error) {
            console.error('Error unregistering device:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

export const deviceController = new DeviceController();
