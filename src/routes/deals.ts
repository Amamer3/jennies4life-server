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
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware to handle both public and admin access for GET /api/deals
const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If auth header is present, use admin middleware
    authMiddleware(req, res, next);
  } else {
    // If no auth header, treat as public request
    next();
  }
};

// Hybrid route - public access returns active deals, admin access returns all deals
const getDealsHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Admin request - return all deals
    await getAllDeals(req as any, res);
  } else {
    // Public request - return only active deals
    await getActiveDeals(req, res);
  }
};

// Public routes - no authentication required
router.get('/public', getActiveDeals);  // GET /api/deals/public
router.get('/public/:id', getDealById); // GET /api/deals/public/:id

// Hybrid route - works for both public and admin
router.get('/', optionalAuthMiddleware, getDealsHandler); // GET /api/deals

// Admin-only routes - authentication required
router.post('/', authMiddleware, createDeal);        // POST /api/deals
router.put('/:id', authMiddleware, updateDeal);      // PUT /api/deals/:id
router.delete('/:id', authMiddleware, deleteDeal);   // DELETE /api/deals/:id

export default router;