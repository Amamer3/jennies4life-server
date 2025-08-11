import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/firebase';
import dotenv from 'dotenv';

dotenv.config();

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if Firebase auth is initialized
    if (!auth) {
      res.status(503).json({ 
        error: 'Service Unavailable', 
        message: 'Firebase authentication not configured. Please contact administrator.' 
      });
      return;
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authorization header with Bearer token is required' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token is required' 
      });
      return;
    }

    let decodedToken: any;
    
    try {
      // First try to verify as ID token
      decodedToken = await auth.verifyIdToken(token);
    } catch (idTokenError: any) {
      console.log('ID token verification failed, trying custom token:', idTokenError.code);
      
      // Check if the error indicates it's a custom token or expired token
      if (idTokenError.code === 'auth/argument-error' || 
          idTokenError.code === 'auth/id-token-expired' ||
          idTokenError.message.includes('custom token') ||
          idTokenError.message.includes('was given a custom token')) {
        try {
          // If ID token verification fails, try to verify as custom token
          // Custom tokens can't be verified directly, so we'll decode the JWT
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(token);
          
          if (!decoded || typeof decoded !== 'object' || !decoded.uid) {
            console.error('Invalid token format:', decoded);
            throw new Error('Invalid token format');
          }
          
          // Get user record to verify admin status
          const userRecord = await auth.getUser(decoded.uid);
          
          // Check if user has admin custom claims
          if (!userRecord.customClaims || !userRecord.customClaims.admin) {
            res.status(403).json({ 
              error: 'Forbidden', 
              message: 'Admin access required' 
            });
            return;
          }
          
          // Check token expiration if present
          if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            console.log('Custom token expired');
            res.status(401).json({ 
              error: 'Token Expired', 
              message: 'Token has expired. Please login again.' 
            });
            return;
          }
          
          decodedToken = {
            uid: userRecord.uid,
            email: userRecord.email,
            admin: true,
            ...userRecord.customClaims
          };
        } catch (customTokenError) {
          console.error('Custom token verification error:', customTokenError);
          throw new Error('Invalid custom token');
        }
      } else {
        // Re-throw the original error if it's not a custom token issue
        console.error('Token verification failed:', idTokenError);
        throw idTokenError;
      }
    }
    
    // Check if user is admin (for ID tokens)
    if (!decodedToken.admin) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || decodedToken.email !== adminEmail) {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Admin access required' 
        });
        return;
      }
    }

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      ...decodedToken
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

export type { AuthenticatedRequest };