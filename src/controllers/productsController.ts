import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse
} from '../utils/types';
import { generateSlug, isSlugUnique, validateRequiredFields, isValidUrl } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const getProductsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('products');
};

// Public: Get all published products
export const getPublishedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const productsCollection = getProductsCollection();
    const snapshot = await productsCollection
      .where('status', '==', 'published')
      .get();

    const products: Product[] = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    const response: ApiResponse<Product[]> = {
      success: true,
      data: products
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching published products:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products'
    };
    res.status(500).json(response);
  }
};

// Public: Get single product by slug
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    const productsCollection = getProductsCollection();
    const snapshot = await productsCollection
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      res.status(404).json(response);
      return;
    }

    const doc = snapshot.docs[0];
    const product: Product = { id: doc.id, ...doc.data() } as Product;

    const response: ApiResponse<Product> = {
      success: true,
      data: product
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch product'
    };
    res.status(500).json(response);
  }
};

// Admin: Create new product
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productData: CreateProductRequest = req.body;

    // Validate required fields
    const requiredFields = ['name', 'image', 'description', 'affiliateLink', 'category'];
    const missingFields = validateRequiredFields(productData, requiredFields);
    
    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
      res.status(400).json(response);
      return;
    }

    // Validate affiliate link URL
    if (!isValidUrl(productData.affiliateLink)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid affiliate link URL'
      };
      res.status(400).json(response);
      return;
    }

    // Generate slug if not provided
    let slug = productData.slug || generateSlug(productData.name);
    
    const productsCollection = getProductsCollection();
    
    // Ensure slug is unique
    const isUnique = await isSlugUnique(productsCollection, slug);
    if (!isUnique) {
      slug = `${slug}-${Date.now()}`;
    }

    const now = Timestamp.now();
    const product: Omit<Product, 'id'> = {
      ...productData,
      slug,
      status: productData.status || 'draft',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await productsCollection.add(product);
    const createdProduct: Product = { id: docRef.id, ...product };

    const response: ApiResponse<Product> = {
      success: true,
      data: createdProduct,
      message: 'Product created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create product'
    };
    res.status(500).json(response);
  }
};

// Admin: Update product
export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateProductRequest = req.body;

    const productsCollection = getProductsCollection();
    
    // Check if product exists
    const docRef = productsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      res.status(404).json(response);
      return;
    }

    // Validate affiliate link if provided
    if (updateData.affiliateLink && !isValidUrl(updateData.affiliateLink)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid affiliate link URL'
      };
      res.status(400).json(response);
      return;
    }

    // Handle slug update
    if (updateData.slug) {
      const isUnique = await isSlugUnique(productsCollection, updateData.slug, id);
      if (!isUnique) {
        const response: ApiResponse = {
          success: false,
          error: 'Slug already exists'
        };
        res.status(400).json(response);
        return;
      }
    }

    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    await docRef.update(updatedData);
    
    // Get updated document
    const updatedDoc = await docRef.get();
    const updatedProduct: Product = { id: updatedDoc.id, ...updatedDoc.data() } as Product;

    const response: ApiResponse<Product> = {
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update product'
    };
    res.status(500).json(response);
  }
};

// Admin: Delete product
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productsCollection = getProductsCollection();

    // Check if product exists
    const docRef = productsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      res.status(404).json(response);
      return;
    }

    await docRef.delete();

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete product'
    };
    res.status(500).json(response);
  }
};