import express from 'express';
import { PostController } from '../controllers/postController';
import { LikeController } from '../controllers/likeController';
import { CommentController } from '../controllers/commentController';
import { verifyToken, verifyTokenOptional } from '../middlewares/verifyToken';
import { validate } from '../middlewares/validate';
import { createPostSchema, updatePostSchema } from '../validations/postValidation';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();


router.get('/feed', verifyTokenOptional, PostController.getFeed);
router.get('/:postId/comments', verifyTokenOptional, CommentController.getCommentsByPost);


router.use(verifyToken);

router.post('/', validate(createPostSchema), PostController.createPost);
router.put('/:id', validate(updatePostSchema), PostController.updatePost);

router.delete('/:id', PostController.deletePost);
router.post('/:id/like', LikeController.likePost);
router.delete('/:id/like', LikeController.unlikePost);

router.post('/:postId/comments', CommentController.createComment);



router.patch('/:id/hide', requireRole([Role.ADMIN]), PostController.adminHidePost);
router.patch('/:id/restore', requireRole([Role.ADMIN]), PostController.adminRestorePost);

export default router;
