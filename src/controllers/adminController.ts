import { Request, Response } from 'express';
import { auth, db } from '../services/firebase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import admin from 'firebase-admin';

interface CreateAdminRequest {
  email: string;
  password: string;
  displayName?: string;
}

interface UpdateAdminRequest {
  displayName?: string;
  isActive?: boolean;
}

/**
 * Create a new admin user
 */
export const createAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, displayName }: CreateAdminRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required'
      });
      return;
    }

    // Check if Firebase auth is available
    if (!auth) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firebase authentication not configured'
      });
      return;
    }

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      res.status(409).json({
        success: false,
        error: 'User Exists',
        message: 'User with this email already exists',
        data: {
          uid: existingUser.uid,
          email: existingUser.email
        }
      });
      return;
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User doesn't exist, continue with creation
    }

    // Create new admin user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || 'Admin User',
      emailVerified: true,
    });

    // Set custom claims for admin role
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    });

    // Create admin profile in Firestore
    const adminProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || 'Admin User',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user?.uid,
      isActive: true
    };

    await db.collection('admins').doc(userRecord.uid).set(adminProfile);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create admin user'
    });
  }
};

/**
 * List all admin users
 */
export const listAdmins = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const adminsSnapshot = await db.collection('admins').orderBy('createdAt', 'desc').get();
    
    const admins = adminsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        permissions: data.permissions,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    });

    res.status(200).json({
      success: true,
      message: 'Admin users retrieved successfully',
      data: {
        admins,
        total: admins.length
      }
    });

  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve admin users'
    });
  }
};

/**
 * Get admin user by ID
 */
export const getAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;

    if (!uid) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Admin UID is required'
      });
      return;
    }

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    // Get admin from Firestore
    const adminDoc = await db.collection('admins').doc(uid).get();
    
    if (!adminDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Admin user not found'
      });
      return;
    }

    const adminData = adminDoc.data()!;
    
    res.status(200).json({
      success: true,
      message: 'Admin user retrieved successfully',
      data: {
        uid: adminData.uid,
        email: adminData.email,
        displayName: adminData.displayName,
        role: adminData.role,
        permissions: adminData.permissions,
        isActive: adminData.isActive,
        createdAt: adminData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: adminData.updatedAt?.toDate?.()?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve admin user'
    });
  }
};

/**
 * Update admin user
 */
export const updateAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;
    const { displayName, isActive }: UpdateAdminRequest = req.body;

    if (!uid) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Admin UID is required'
      });
      return;
    }

    // Check if Firebase auth is available
    if (!auth) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firebase authentication not configured'
      });
      return;
    }

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    // Check if admin exists
    const adminDoc = await db.collection('admins').doc(uid).get();
    
    if (!adminDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Admin user not found'
      });
      return;
    }

    // Prevent self-deactivation
    if (isActive === false && uid === req.user?.uid) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Cannot deactivate your own account'
      });
      return;
    }

    // Update Firebase user if displayName is provided
    if (displayName) {
      await auth.updateUser(uid, { displayName });
    }

    // Update Firestore document
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
      // If deactivating, also disable the Firebase user
      if (!isActive) {
        await auth.updateUser(uid, { disabled: true });
      } else {
        await auth.updateUser(uid, { disabled: false });
      }
    }

    await db.collection('admins').doc(uid).update(updateData);

    // Get updated admin data
    const updatedAdminDoc = await db.collection('admins').doc(uid).get();
    const updatedAdminData = updatedAdminDoc.data()!;

    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        uid: updatedAdminData.uid,
        email: updatedAdminData.email,
        displayName: updatedAdminData.displayName,
        role: updatedAdminData.role,
        permissions: updatedAdminData.permissions,
        isActive: updatedAdminData.isActive,
        createdAt: updatedAdminData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: updatedAdminData.updatedAt?.toDate?.()?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update admin user'
    });
  }
};

/**
 * Delete admin user
 */
export const deleteAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;

    if (!uid) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Admin UID is required'
      });
      return;
    }

    // Check if Firebase auth is available
    if (!auth) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firebase authentication not configured'
      });
      return;
    }

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    // Prevent self-deletion
    if (uid === req.user?.uid) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Cannot delete your own account'
      });
      return;
    }

    // Check if admin exists
    const adminDoc = await db.collection('admins').doc(uid).get();
    
    if (!adminDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Admin user not found'
      });
      return;
    }

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection('admins').doc(uid).delete();

    res.status(200).json({
      success: true,
      message: 'Admin user deleted successfully',
      data: {
        uid,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete admin user'
    });
  }
};

/**
 * Get dashboard access statistics
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const adminsSnapshot = await db.collection('admins').get();
    
    const totalAdmins = adminsSnapshot.size;
    const activeAdmins = adminsSnapshot.docs.filter(doc => doc.data().isActive).length;
    const inactiveAdmins = totalAdmins - activeAdmins;

    // Get recent admin activities (you can expand this based on your needs)
    const recentAdmins = adminsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null
        };
      })
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        recentAdmins
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard statistics'
    });
  }
};