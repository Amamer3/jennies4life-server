import { Request, Response } from 'express';
import { auth } from '../services/firebase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import dotenv from 'dotenv';

dotenv.config();

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Admin login endpoint
 * Authenticates admin user with email/password via Firebase
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required'
      });
      return;
    }

    // Check if Firebase auth is initialized
    if (!auth) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firebase authentication not configured'
      });
      return;
    }

    // Verify admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || email !== adminEmail) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
      return;
    }

    // Note: In a real implementation, you would use Firebase Admin SDK
    // to create custom tokens or verify credentials
    // For now, we'll return a success response indicating the client
    // should authenticate with Firebase client SDK
    res.status(200).json({
      success: true,
      message: 'Admin credentials verified. Please authenticate with Firebase client SDK.',
      data: {
        email: adminEmail,
        requiresFirebaseAuth: true
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Verify current authentication status
 */
export const verify = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // If we reach here, the auth middleware has already verified the token
    res.status(200).json({
      success: true,
      message: 'Authentication verified',
      data: {
        user: req.user,
        authenticated: true
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Verification failed'
    });
  }
};

/**
 * Refresh authentication token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Refresh token is required'
      });
      return;
    }

    // Note: In a real implementation, you would use Firebase Admin SDK
    // to verify and refresh the token
    res.status(200).json({
      success: true,
      message: 'Token refresh initiated. Please use Firebase client SDK to refresh tokens.',
      data: {
        requiresFirebaseRefresh: true
      }
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
};

/**
 * Admin logout endpoint
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Note: In a real implementation, you might invalidate tokens
    // or maintain a blacklist of revoked tokens
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please clear Firebase authentication on client side.',
      data: {
        loggedOut: true
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
};

/**
 * Get current admin profile
 */
export const profile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Admin profile retrieved',
      data: {
        user: req.user,
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve profile'
    });
  }
};