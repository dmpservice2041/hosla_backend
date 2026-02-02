import express from 'express';
import { CommentController } from '../controllers/commentController';
import { LikeController } from '../controllers/likeController';
import { verifyToken, requireCompleteProfile } from '../middlewares/verifyToken';

const router = express.Router();


router.use(verifyToken);
router.use(requireCompleteProfile);


router.delete('/:id', CommentController.deleteComment);

router.post('/:id/like', LikeController.likeComment);
router.delete('/:id/like', LikeController.unlikeComment);

export default router;
