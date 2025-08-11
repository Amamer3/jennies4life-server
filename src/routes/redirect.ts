import { Router } from 'express';
import {
  redirectToAffiliate,
  getProductClickAnalytics
} from '../controllers/redirectController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route - redirect to affiliate link with click tracking
router.get('/:productSlug', redirectToAffiliate);

// Admin route - get click analytics for a product
router.get('/analytics/:productSlug', authMiddleware, getProductClickAnalytics);

export default router;