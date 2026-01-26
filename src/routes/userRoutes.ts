import express from 'express';
import { UserController } from '../controllers/userController';
import { verifyToken } from '../middlewares/verifyToken';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validations/userValidation';
import { platformGuard } from '../middlewares/platformGuard';
import { Platform } from '../types/platformTypes';

const router = express.Router();

router.use(verifyToken);
router.use(platformGuard([Platform.WEB]));

router.get('/profile', UserController.getProfile);
router.put('/profile', upload.single('profilePicture'), validate(updateProfileSchema), UserController.updateProfile);

export default router;
