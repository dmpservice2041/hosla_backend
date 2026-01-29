import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import postRoutes from './postRoutes';
import commentRoutes from './commentRoutes';
import reportRoutes from './reportRoutes';
import analyticsRoutes from './analyticsRoutes';
import deviceRoutes from './deviceRoutes';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/reports', reportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/devices', deviceRoutes);

export default router;
