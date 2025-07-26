import { Router } from 'express';
import {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost
} from '../controllers/postsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no authentication required)
router.get('/', getPublishedPosts);
router.get('/:slug', getPostBySlug);

// Admin routes (authentication required)
router.post('/', authMiddleware, createPost);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;