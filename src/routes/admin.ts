import { Router } from 'express';
import {
  createAdmin,
  listAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getDashboardStats
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All admin management routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/admin/users
 * @desc Create a new admin user
 * @access Private (Admin only)
 */
router.post('/users', createAdmin);

/**
 * @route GET /api/admin/users
 * @desc Get all admin users
 * @access Private (Admin only)
 */
router.get('/users', listAdmins);

/**
 * @route GET /api/admin/users/:uid
 * @desc Get admin user by UID
 * @access Private (Admin only)
 */
router.get('/users/:uid', getAdmin);

/**
 * @route PUT /api/admin/users/:uid
 * @desc Update admin user
 * @access Private (Admin only)
 */
router.put('/users/:uid', updateAdmin);

/**
 * @route DELETE /api/admin/users/:uid
 * @desc Delete admin user
 * @access Private (Admin only)
 */
router.delete('/users/:uid', deleteAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Get dashboard access statistics
 * @access Private (Admin only)
 */
router.get('/stats', getDashboardStats);

export default router;