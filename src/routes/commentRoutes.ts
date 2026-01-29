import express from 'express';
import { CommentController } from '../controllers/commentController';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();


router.use(verifyToken);


router.delete('/:id', CommentController.deleteComment);

export default router;
