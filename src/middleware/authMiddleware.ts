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

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || decodedToken.email !== adminEmail) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
      return;
    }

    // Attach user info to request
    req.user = {
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