import { Router } from 'express';
import { login, logout, refresh, verify, profile } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 * @access Public
 */
router.post('/refresh', refresh);

/**
 * @route GET /api/auth/verify
 * @desc Verify current authentication status
 * @access Private (Admin)
 */
router.get('/verify', authMiddleware, verify);

/**
 * @route POST /api/auth/logout
 * @desc Admin logout
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/auth/profile
 * @desc Get admin profile
 * @access Private (Admin)
 */
router.get('/profile', authMiddleware, profile);

export default router;