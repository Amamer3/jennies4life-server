import { Router } from 'express';
import {
  getActiveDeals,
  getDealById,
  getAllDeals,
  createDeal,
  updateDeal,
  deleteDeal
} from '../controllers/dealsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes - no authentication required
router.get('/public', getActiveDeals);  // GET /api/deals/public
router.get('/public/:id', getDealById); // GET /api/deals/public/:id

// Admin routes - authentication required
router.get('/', authMiddleware, getAllDeals);        // GET /api/deals
router.post('/', authMiddleware, createDeal);        // POST /api/deals
router.put('/:id', authMiddleware, updateDeal);      // PUT /api/deals/:id
router.delete('/:id', authMiddleware, deleteDeal);   // DELETE /api/deals/:id

export default router;