import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { ApiResponse } from '../utils/types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  recentProducts: any[];
  recentPosts: any[];
}

const getCollection = (collectionName: string) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection(collectionName);
};

// Admin: Get dashboard statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productsCollection = getCollection('products');
    const postsCollection = getCollection('posts');

    // Get all products
    const allProductsSnapshot = await productsCollection.get();
    const publishedProductsSnapshot = await productsCollection.where('status', '==', 'published').get();
    const draftProductsSnapshot = await productsCollection.where('status', '==', 'draft').get();

    // Get all posts
    const allPostsSnapshot = await postsCollection.get();
    const publishedPostsSnapshot = await postsCollection.where('status', '==', 'published').get();
    const draftPostsSnapshot = await postsCollection.where('status', '==', 'draft').get();

    // Get recent products (last 5)
    const recentProductsSnapshot = await productsCollection
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentProducts: any[] = [];
    recentProductsSnapshot.forEach(doc => {
      recentProducts.push({ id: doc.id, ...doc.data() });
    });

    // Get recent posts (last 5)
    const recentPostsSnapshot = await postsCollection
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentPosts: any[] = [];
    recentPostsSnapshot.forEach(doc => {
      recentPosts.push({ id: doc.id, ...doc.data() });
    });

    const stats: DashboardStats = {
      totalProducts: allProductsSnapshot.size,
      publishedProducts: publishedProductsSnapshot.size,
      draftProducts: draftProductsSnapshot.size,
      totalPosts: allPostsSnapshot.size,
      publishedPosts: publishedPostsSnapshot.size,
      draftPosts: draftPostsSnapshot.size,
      recentProducts,
      recentPosts
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    };
    res.status(500).json(response);
  }
};

// Admin: Get all products (including drafts)
export const getAllProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productsCollection = getCollection('products');
    const snapshot = await productsCollection.orderBy('createdAt', 'desc').get();

    const products: any[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: products
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching all products:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products'
    };
    res.status(500).json(response);
  }
};

// Admin: Get all posts (including drafts)
export const getAllPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postsCollection = getCollection('posts');
    const snapshot = await postsCollection.orderBy('createdAt', 'desc').get();

    const posts: any[] = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: posts
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch posts'
    };
    res.status(500).json(response);
  }
};

// Admin: Get recent orders
export const getRecentOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ordersCollection = getCollection('orders');
    const snapshot = await ordersCollection
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const orders: any[] = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: orders
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch recent orders'
    };
    res.status(500).json(response);
  }
};