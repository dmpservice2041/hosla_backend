import express from 'express';
import { ReportController } from '../controllers/reportController';
import { verifyToken } from '../middlewares/verifyToken';
import { validate } from '../middlewares/validate';
import { createReportSchema } from '../validations/reportValidation';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(verifyToken);

router.post('/', requireRole([Role.USER]), validate(createReportSchema), ReportController.createReport);

router.get('/', requireRole([Role.ADMIN, Role.STAFF]), ReportController.getReports);

router.patch('/:id/dismiss', requireRole([Role.ADMIN]), ReportController.dismissReport);

export default router;
