import express from 'express';
import { UserController } from '../controllers/userController';
import { BlockedUserController } from '../controllers/blockedUserController';
import { verifyToken } from '../middlewares/verifyToken';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validations/userValidation';
import { userIdParamSchema } from '../validations/blockedUserValidation';
import { platformGuard } from '../middlewares/platformGuard';
import { Platform } from '../types/platformTypes';

const router = express.Router();

router.use(verifyToken);
router.use(platformGuard([Platform.WEB]));

router.get('/profile', UserController.getProfile);
router.put('/profile', upload.single('profilePicture'), validate(updateProfileSchema), UserController.updateProfile);

router.post('/:userId/block', validate({ params: userIdParamSchema }), BlockedUserController.blockUser);
router.delete('/:userId/unblock', validate({ params: userIdParamSchema }), BlockedUserController.unblockUser);
router.get('/blocked', BlockedUserController.getBlockedUsers);

export default router;
