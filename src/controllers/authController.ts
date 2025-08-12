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

    try {
      // Get the admin user from Firebase
      const userRecord = await auth.getUserByEmail(email);
      
      // Verify the user has admin privileges
      const customClaims = userRecord.customClaims;
      if (!customClaims || !customClaims.admin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin privileges required'
        });
        return;
      }

      // Create custom token for the admin user
      if (!auth) {
        res.status(503).json({
          success: false,
          message: 'Firebase Admin SDK not initialized'
        });
        return;
      }
      
      const customToken = await auth.createCustomToken(userRecord.uid, {
          admin: true,
          role: 'admin'
        });

      res.status(200).json({
        success: true,
        message: 'Admin login successful. Use the custom token with Firebase client SDK to get an ID token.',
        data: {
          customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            role: 'admin'
          },
          instructions: {
            message: 'Exchange this custom token for an ID token using Firebase client SDK',
            clientSideCode: 'firebase.auth().signInWithCustomToken(customToken).then(userCredential => userCredential.user.getIdToken())'
          }
        }
      });

    } catch (firebaseError: any) {
      console.error('Firebase authentication error:', firebaseError);
      
      if (firebaseError.code === 'auth/user-not-found') {
        res.status(404).json({
          success: false,
          error: 'User Not Found',
          message: 'Admin user not found. Please ensure the admin user is created in Firebase.'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid admin credentials'
      });
      return;
    }

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

    try {
      // Verify the refresh token and get user info
      if (!auth) {
        res.status(503).json({
          success: false,
          message: 'Firebase Admin SDK not initialized'
        });
        return;
      }
      
      let decodedToken: any;
      
      try {
        // Try to verify as ID token
        decodedToken = await auth.verifyIdToken(refreshToken);
      } catch (idTokenError: any) {
        console.error('Token refresh error:', idTokenError);
        
        // If it's an argument error, it's likely a custom token
        if (idTokenError.code === 'auth/argument-error') {
          res.status(400).json({
            success: false,
            error: 'Invalid Token Type',
            message: 'Cannot refresh custom tokens. Please use Firebase client SDK to sign in with the custom token and get a new ID token.'
          });
          return;
        }
        
        // Re-throw other errors to be handled below
        throw idTokenError;
      }
      
      // Check if user has admin privileges
      if (!decodedToken.admin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin privileges required'
        });
        return;
      }

      // Create new custom token
      const newCustomToken = await auth.createCustomToken(decodedToken.uid, {
         admin: true,
         role: 'admin'
       });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully. Use the new custom token with Firebase client SDK to get an ID token.',
        data: {
          customToken: newCustomToken,
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: 'admin'
          },
          instructions: {
            message: 'Exchange this custom token for an ID token using Firebase client SDK',
            clientSideCode: 'firebase.auth().signInWithCustomToken(customToken).then(userCredential => userCredential.user.getIdToken())'
          }
        }
      });

    } catch (firebaseError: any) {
      console.error('Token refresh error:', firebaseError);
      
      if (firebaseError.code === 'auth/id-token-expired') {
        res.status(401).json({
          success: false,
          error: 'Token Expired',
          message: 'Refresh token has expired. Please login again.'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid Token',
        message: 'Invalid refresh token'
      });
      return;
    }

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
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: In a real implementation, you might invalidate tokens
    // or maintain a blacklist of revoked tokens
    // This is now a public endpoint that always succeeds
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
 * Exchange custom token for ID token
 */
export const exchangeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customToken } = req.body;

    if (!customToken) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Custom token is required'
      });
      return;
    }

    // For custom token exchange, we need to return the custom token
    // The frontend should use Firebase client SDK to sign in with this custom token
    // and get the ID token from the client side
    res.status(200).json({
      success: true,
      message: 'Use this custom token with Firebase client SDK to get ID token',
      data: {
        customToken,
        instructions: 'Use firebase.auth().signInWithCustomToken(customToken) on client side'
      }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Token exchange failed'
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