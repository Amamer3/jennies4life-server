import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories
} from '../controllers/categoriesController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', getCategories); // Get all categories with product counts
router.get('/:slug', getCategoryBySlug); // Get category by slug
router.get('/:slug/products', getProductsByCategory); // Get products by category

// Admin routes (require authentication)
router.post('/', authMiddleware, createCategory); // Create new category
router.put('/:id', authMiddleware, updateCategory); // Update category
router.delete('/:id', authMiddleware, deleteCategory); // Delete category
router.get('/admin/all', authMiddleware, getAllCategories); // Get all categories (admin view)

export default router;