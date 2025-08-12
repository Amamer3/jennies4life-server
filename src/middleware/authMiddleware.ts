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
      // Try to verify as ID token first
      decodedToken = await auth.verifyIdToken(token);
    } catch (idTokenError: any) {
      console.log('ID token verification failed:', idTokenError.code);
      
      // If it's an argument error, it might be a custom token
      if (idTokenError.code === 'auth/argument-error') {
        res.status(401).json({ 
          error: 'Invalid Token Type', 
          message: 'Custom tokens must be exchanged for ID tokens on the client side. Please use Firebase client SDK to sign in with the custom token first.' 
        });
        return;
      }
      
      // Handle other token errors
      if (idTokenError.code === 'auth/id-token-expired') {
        res.status(401).json({ 
          error: 'Token Expired', 
          message: 'Token has expired. Please refresh your token.' 
        });
        return;
      }
      
      // Re-throw other errors
      console.error('Token verification failed:', idTokenError);
      throw idTokenError;
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