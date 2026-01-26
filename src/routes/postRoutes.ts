import express from 'express';
import { PostController } from '../controllers/postController';
import { verifyToken } from '../middlewares/verifyToken';
import { validate } from '../middlewares/validate';
import { createPostSchema, updatePostSchema } from '../validations/postValidation';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(verifyToken);

router.post('/', validate(createPostSchema), PostController.createPost);
router.get('/feed', PostController.getFeed);
router.put('/:id', validate(updatePostSchema), PostController.updatePost);
router.put('/:id', validate(updatePostSchema), PostController.updatePost);
router.delete('/:id', PostController.deletePost);


router.patch('/:id/hide', requireRole([Role.ADMIN]), PostController.adminHidePost);
router.patch('/:id/restore', requireRole([Role.ADMIN]), PostController.adminRestorePost);

export default router;
