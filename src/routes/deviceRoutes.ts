import { Router } from 'express';
import { deviceController } from '../controllers/deviceController';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();


router.use(verifyToken);

router.post('/', deviceController.registerDevice);
router.delete('/:token', deviceController.unregisterDevice);

export default router;
