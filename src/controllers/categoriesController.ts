import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { ApiResponse } from '../utils/types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { generateSlug, isSlugUnique, validateRequiredFields } from '../utils/helpers';

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
}

const getCategoriesCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('categories');
};

const getProductsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('products');
};

/**
 * Public: Get all categories with product counts
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
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

    const categoriesCollection = getCategoriesCollection();
    const productsCollection = getProductsCollection();
    
    const snapshot = await categoriesCollection.orderBy('name', 'asc').get();
    
    const categories: Category[] = [];
    
    // Get product counts for each category
    for (const doc of snapshot.docs) {
      const categoryData = doc.data() as Omit<Category, 'id'>;
      
      // Count products in this category
      const productSnapshot = await productsCollection
        .where('category', '==', categoryData.name)
        .where('status', '==', 'published')
        .get();
      
      categories.push({
        id: doc.id,
        ...categoryData,
        productCount: productSnapshot.size
      });
    }

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch categories'
    };
    res.status(500).json(response);
  }
};

/**
 * Public: Get category by slug
 */
export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const categoriesCollection = getCategoriesCollection();
    const productsCollection = getProductsCollection();
    
    const snapshot = await categoriesCollection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Category not found'
      };
      res.status(404).json(response);
      return;
    }

    const doc = snapshot.docs[0];
    const categoryData = doc.data() as Omit<Category, 'id'>;
    
    // Count products in this category
    const productSnapshot = await productsCollection
      .where('category', '==', categoryData.name)
      .where('status', '==', 'published')
      .get();
    
    const category: Category = {
      id: doc.id,
      ...categoryData,
      productCount: productSnapshot.size
    };

    const response: ApiResponse<Category> = {
      success: true,
      data: category
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch category'
    };
    res.status(500).json(response);
  }
};

/**
 * Public: Get products by category
 */
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const categoriesCollection = getCategoriesCollection();
    const productsCollection = getProductsCollection();
    
    // First, find the category by slug
    const categorySnapshot = await categoriesCollection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (categorySnapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Category not found'
      };
      res.status(404).json(response);
      return;
    }

    const categoryDoc = categorySnapshot.docs[0];
    const categoryData = categoryDoc.data() as Omit<Category, 'id'>;
    
    // Get products in this category
    const productsSnapshot = await productsCollection
      .where('category', '==', categoryData.name)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get();

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        category: {
          id: categoryDoc.id,
          ...categoryData
        },
        products,
        totalProducts: products.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products by category'
    };
    res.status(500).json(response);
  }
};

/**
 * Admin: Create new category
 */
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryData: CreateCategoryRequest = req.body;

    // Validate required fields
    const requiredFields = ['name'];
    const missingFields = validateRequiredFields(categoryData, requiredFields);
    
    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
      res.status(400).json(response);
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

    // Generate slug if not provided
    let slug = categoryData.slug || generateSlug(categoryData.name);
    
    const categoriesCollection = getCategoriesCollection();
    
    // Ensure slug is unique
    const isUnique = await isSlugUnique(categoriesCollection, slug);
    if (!isUnique) {
      slug = `${slug}-${Date.now()}`;
    }

    // Check if category name already exists
    const nameSnapshot = await categoriesCollection
      .where('name', '==', categoryData.name)
      .limit(1)
      .get();

    if (!nameSnapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Category name already exists'
      };
      res.status(400).json(response);
      return;
    }

    const now = Timestamp.now();
    const category: Omit<Category, 'id'> = {
      name: categoryData.name,
      slug,
      description: categoryData.description || '',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await categoriesCollection.add(category);
    const createdCategory: Category = { id: docRef.id, ...category, productCount: 0 };

    const response: ApiResponse<Category> = {
      success: true,
      data: createdCategory,
      message: 'Category created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating category:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create category'
    };
    res.status(500).json(response);
  }
};

/**
 * Admin: Update category
 */
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateCategoryRequest = req.body;

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const categoriesCollection = getCategoriesCollection();
    
    // Check if category exists
    const docRef = categoriesCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Category not found'
      };
      res.status(404).json(response);
      return;
    }

    // Handle slug update
    if (updateData.slug) {
      const isUnique = await isSlugUnique(categoriesCollection, updateData.slug, id);
      if (!isUnique) {
        const response: ApiResponse = {
          success: false,
          error: 'Slug already exists'
        };
        res.status(400).json(response);
        return;
      }
    }

    // Handle name update
    if (updateData.name) {
      const nameSnapshot = await categoriesCollection
        .where('name', '==', updateData.name)
        .limit(1)
        .get();

      if (!nameSnapshot.empty && nameSnapshot.docs[0].id !== id) {
        const response: ApiResponse = {
          success: false,
          error: 'Category name already exists'
        };
        res.status(400).json(response);
        return;
      }
    }

    const updatePayload: any = {
      updatedAt: Timestamp.now()
    };

    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.slug !== undefined) updatePayload.slug = updateData.slug;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;

    await docRef.update(updatePayload);

    // Get updated category
    const updatedDoc = await docRef.get();
    const updatedCategoryData = updatedDoc.data() as Omit<Category, 'id'>;
    
    // Get product count
    const productsCollection = getProductsCollection();
    const productSnapshot = await productsCollection
      .where('category', '==', updatedCategoryData.name)
      .where('status', '==', 'published')
      .get();
    
    const updatedCategory: Category = {
      id: updatedDoc.id,
      ...updatedCategoryData,
      productCount: productSnapshot.size
    };

    const response: ApiResponse<Category> = {
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update category'
    };
    res.status(500).json(response);
  }
};

/**
 * Admin: Delete category
 */
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if Firestore is available
    if (!db) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database not configured'
      });
      return;
    }

    const categoriesCollection = getCategoriesCollection();
    const productsCollection = getProductsCollection();
    
    // Check if category exists
    const docRef = categoriesCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Category not found'
      };
      res.status(404).json(response);
      return;
    }

    const categoryData = doc.data() as Omit<Category, 'id'>;
    
    // Check if category has products
    const productSnapshot = await productsCollection
      .where('category', '==', categoryData.name)
      .limit(1)
      .get();

    if (!productSnapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete category with existing products',
        message: 'Please move or delete all products in this category first'
      };
      res.status(400).json(response);
      return;
    }

    await docRef.delete();

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
      data: {
        id,
        deletedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete category'
    };
    res.status(500).json(response);
  }
};

/**
 * Admin: Get all categories (including drafts)
 */
export const getAllCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const categoriesCollection = getCategoriesCollection();
    const productsCollection = getProductsCollection();
    
    const snapshot = await categoriesCollection.orderBy('name', 'asc').get();
    
    const categories: Category[] = [];
    
    // Get product counts for each category (including drafts for admin)
    for (const doc of snapshot.docs) {
      const categoryData = doc.data() as Omit<Category, 'id'>;
      
      // Count all products in this category
      const productSnapshot = await productsCollection
        .where('category', '==', categoryData.name)
        .get();
      
      categories.push({
        id: doc.id,
        ...categoryData,
        productCount: productSnapshot.size
      });
    }

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch categories'
    };
    res.status(500).json(response);
  }
};