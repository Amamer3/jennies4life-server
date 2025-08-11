import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { Product, ClickEvent, ApiResponse } from '../utils/types';

const getProductsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('products');
};

const getClickEventsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('clickEvents');
};

// Get user IP address from request
const getUserIP = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string) ||
         (req.headers['x-real-ip'] as string) ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
};

// Redirect to affiliate link with click tracking
export const redirectToAffiliate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productSlug } = req.params;
    
    if (!productSlug) {
      const response: ApiResponse = {
        success: false,
        error: 'Product slug is required'
      };
      res.status(400).json(response);
      return;
    }

    const productsCollection = getProductsCollection();
    
    // Find product by slug
    const snapshot = await productsCollection
      .where('slug', '==', productSlug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found or not published'
      };
      res.status(404).json(response);
      return;
    }

    const doc = snapshot.docs[0];
    const product: Product = { id: doc.id, ...doc.data() } as Product;

    if (!product.affiliateLink) {
      const response: ApiResponse = {
        success: false,
        error: 'Affiliate link not available for this product'
      };
      res.status(400).json(response);
      return;
    }

    // Track the click event
    const clickEvent: Omit<ClickEvent, 'id'> = {
      productId: product.id!,
      productSlug: product.slug,
      userIP: getUserIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: (Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer) || 
                (Array.isArray(req.headers.referrer) ? req.headers.referrer[0] : req.headers.referrer) || 'direct',
      timestamp: Timestamp.now()
    };

    // Save click event to database
    const clickEventsCollection = getClickEventsCollection();
    await clickEventsCollection.add(clickEvent);

    // Update product click count
    const currentClickCount = product.clickCount || 0;
    await doc.ref.update({
      clickCount: currentClickCount + 1,
      lastClickedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Redirect to affiliate link
    res.redirect(302, product.affiliateLink);
    
  } catch (error) {
    console.error('Error in redirect controller:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error during redirect'
    };
    res.status(500).json(response);
  }
};

// Get click analytics for a specific product (Admin only)
export const getProductClickAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productSlug } = req.params;
    
    if (!productSlug) {
      const response: ApiResponse = {
        success: false,
        error: 'Product slug is required'
      };
      res.status(400).json(response);
      return;
    }

    const productsCollection = getProductsCollection();
    const clickEventsCollection = getClickEventsCollection();
    
    // Get product info
    const productSnapshot = await productsCollection
      .where('slug', '==', productSlug)
      .limit(1)
      .get();

    if (productSnapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      res.status(404).json(response);
      return;
    }

    const productDoc = productSnapshot.docs[0];
    const product: Product = { id: productDoc.id, ...productDoc.data() } as Product;

    // Get click events for this product
    const clickSnapshot = await clickEventsCollection
      .where('productId', '==', product.id)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const clickEvents: ClickEvent[] = [];
    clickSnapshot.forEach(doc => {
      clickEvents.push({ id: doc.id, ...doc.data() } as ClickEvent);
    });

    const analytics = {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        clickCount: product.clickCount || 0,
        lastClickedAt: product.lastClickedAt
      },
      recentClicks: clickEvents,
      totalClicks: product.clickCount || 0
    };

    const response: ApiResponse = {
      success: true,
      data: analytics
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching click analytics:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch click analytics'
    };
    res.status(500).json(response);
  }
};