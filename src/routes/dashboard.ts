import { Router } from 'express';
import {
  getDashboardStats,
  getAllProducts,
  getAllPosts,
  getRecentOrders
} from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All dashboard routes require authentication
router.get('/stats', authMiddleware, getDashboardStats);
router.get('/products', authMiddleware, getAllProducts);
router.get('/posts', authMiddleware, getAllPosts);
router.get('/orders/recent', authMiddleware, getRecentOrders);

export default router;