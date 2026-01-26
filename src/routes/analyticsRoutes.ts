import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole([Role.ADMIN]));

router.get('/safety', AnalyticsController.getSafetyStats);

export default router;
