import { Router } from 'express';
import {
  getPublishedProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no authentication required)
router.get('/', getPublishedProducts);
router.get('/:slug', getProductBySlug);

// Admin routes (authentication required)
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;