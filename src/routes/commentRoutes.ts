import express from 'express';
import { CommentController } from '../controllers/commentController';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

// Middleware
router.use(verifyToken);

// Routes
// Note: POST and GET are nested in postRoutes. 
// This file handles direct operations on comments (DELETE, PUT)
router.delete('/:id', CommentController.deleteComment);

export default router;
