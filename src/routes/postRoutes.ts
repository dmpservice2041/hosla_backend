import express from 'express';
import { PostController } from '../controllers/postController';
import { LikeController } from '../controllers/likeController';
import { CommentController } from '../controllers/commentController';
import { SavedPostController } from '../controllers/savedPostController';
import { verifyToken, verifyTokenOptional, requireCompleteProfile } from '../middlewares/verifyToken';
import { savePostRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { createPostSchema, updatePostSchema, userIdParamSchema } from '../validations/postValidation';
import { postIdParamSchema } from '../validations/savedPostValidation';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '@prisma/client';

const router = express.Router();



router.get('/feed', verifyToken, requireCompleteProfile, PostController.getFeed);
router.get('/user/:userId', verifyToken, requireCompleteProfile, validate({ params: userIdParamSchema }), PostController.getUserPosts);
router.get('/:postId/comments', verifyToken, requireCompleteProfile, CommentController.getCommentsByPost);



router.use(verifyToken);
router.use(requireCompleteProfile);


router.post('/', validate(createPostSchema), PostController.createPost);
router.put('/:id', validate(updatePostSchema), PostController.updatePost);

router.delete('/:id', PostController.deletePost);
router.post('/:id/like', LikeController.likePost);
router.delete('/:id/like', LikeController.unlikePost);

router.post('/:postId/save', savePostRateLimiter, validate({ params: postIdParamSchema }), SavedPostController.savePost);
router.delete('/:postId/save', savePostRateLimiter, validate({ params: postIdParamSchema }), SavedPostController.unsavePost);
router.get('/saved/list', SavedPostController.getSavedPosts);

router.post('/:postId/comments', CommentController.createComment);



router.patch('/:id/hide', requireRole([Role.ADMIN]), PostController.adminHidePost);
router.patch('/:id/restore', requireRole([Role.ADMIN]), PostController.adminRestorePost);

export default router;
