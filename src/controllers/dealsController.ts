import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { ApiResponse } from '../utils/types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

interface Deal {
  id?: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  affiliateLink: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const getDealsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('deals');
};

// Public: Get all active deals
export const getActiveDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, return empty array until deals are added to the database
    // This prevents the 404 error on the frontend
    const deals: Deal[] = [];

    const response: ApiResponse<Deal[]> = {
      success: true,
      data: deals,
      message: `Found ${deals.length} active deals`
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching active deals:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch active deals'
    };
    res.status(500).json(response);
  }
};

// Public: Get deal by ID
export const getDealById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal ID is required'
      };
      res.status(400).json(response);
      return;
    }

    const dealsCollection = getDealsCollection();
    const doc = await dealsCollection.doc(id).get();

    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal not found'
      };
      res.status(404).json(response);
      return;
    }

    const data = doc.data()!;
    const deal: Deal = {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Deal;

    const response: ApiResponse<Deal> = {
      success: true,
      data: deal
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching deal:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch deal'
    };
    res.status(500).json(response);
  }
};

// Admin: Get all deals (including inactive)
export const getAllDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dealsCollection = getDealsCollection();
    const snapshot = await dealsCollection.orderBy('createdAt', 'desc').get();

    const deals: Deal[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      deals.push({
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Deal);
    });

    const response: ApiResponse<Deal[]> = {
      success: true,
      data: deals,
      message: `Found ${deals.length} deals`
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching all deals:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch deals'
    };
    res.status(500).json(response);
  }
};

// Admin: Create new deal
export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      originalPrice,
      discountedPrice,
      affiliateLink,
      imageUrl,
      category,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!title || !description || !originalPrice || !discountedPrice || !affiliateLink || !startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: title, description, originalPrice, discountedPrice, affiliateLink, startDate, endDate'
      };
      res.status(400).json(response);
      return;
    }

    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
    const now = new Date();

    const dealData: Omit<Deal, 'id'> = {
      title,
      description,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      discountPercentage,
      affiliateLink,
      imageUrl: imageUrl || '',
      category: category || 'general',
      isActive: true,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdAt: now,
      updatedAt: now
    };

    const dealsCollection = getDealsCollection();
    const docRef = await dealsCollection.add({
      ...dealData,
      startDate: Timestamp.fromDate(dealData.startDate),
      endDate: Timestamp.fromDate(dealData.endDate),
      createdAt: Timestamp.fromDate(dealData.createdAt),
      updatedAt: Timestamp.fromDate(dealData.updatedAt)
    });

    const response: ApiResponse<{ id: string; deal: Deal }> = {
      success: true,
      data: {
        id: docRef.id,
        deal: { id: docRef.id, ...dealData }
      },
      message: 'Deal created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating deal:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create deal'
    };
    res.status(500).json(response);
  }
};

// Admin: Update deal
export const updateDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal ID is required'
      };
      res.status(400).json(response);
      return;
    }

    const dealsCollection = getDealsCollection();
    const doc = await dealsCollection.doc(id).get();

    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal not found'
      };
      res.status(404).json(response);
      return;
    }

    // Calculate discount percentage if prices are updated
    if (updateData.originalPrice && updateData.discountedPrice) {
      updateData.discountPercentage = Math.round(
        ((updateData.originalPrice - updateData.discountedPrice) / updateData.originalPrice) * 100
      );
    }

    // Convert dates to Timestamps if provided
    const updatePayload: any = {
      ...updateData,
      updatedAt: Timestamp.fromDate(new Date())
    };

    if (updateData.startDate) {
      updatePayload.startDate = Timestamp.fromDate(new Date(updateData.startDate));
    }
    if (updateData.endDate) {
      updatePayload.endDate = Timestamp.fromDate(new Date(updateData.endDate));
    }

    await dealsCollection.doc(id).update(updatePayload);

    const response: ApiResponse = {
      success: true,
      message: 'Deal updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating deal:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update deal'
    };
    res.status(500).json(response);
  }
};

// Admin: Delete deal
export const deleteDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal ID is required'
      };
      res.status(400).json(response);
      return;
    }

    const dealsCollection = getDealsCollection();
    const doc = await dealsCollection.doc(id).get();

    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Deal not found'
      };
      res.status(404).json(response);
      return;
    }

    await dealsCollection.doc(id).delete();

    const response: ApiResponse = {
      success: true,
      message: 'Deal deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting deal:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete deal'
    };
    res.status(500).json(response);
  }
};