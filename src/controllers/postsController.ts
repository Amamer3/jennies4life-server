import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import {
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  ApiResponse
} from '../utils/types';
import { generateSlug, isSlugUnique, validateRequiredFields, isValidUrl } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const getPostsCollection = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure your Firebase credentials.');
  }
  return db.collection('posts');
};

// Public: Get all published posts
export const getPublishedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const postsCollection = getPostsCollection();
    const snapshot = await postsCollection
      .where('status', '==', 'published')
      .get();

    const posts: BlogPost[] = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() } as BlogPost);
    });

    const response: ApiResponse<BlogPost[]> = {
      success: true,
      data: posts
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching published posts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch posts'
    };
    res.status(500).json(response);
  }
};

// Public: Get single blog post by slug
export const getPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    const postsCollection = getPostsCollection();
    const snapshot = await postsCollection
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      const response: ApiResponse = {
        success: false,
        error: 'Post not found'
      };
      res.status(404).json(response);
      return;
    }

    const doc = snapshot.docs[0];
    const post: BlogPost = { id: doc.id, ...doc.data() } as BlogPost;

    const response: ApiResponse<BlogPost> = {
      success: true,
      data: post
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching post:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch post'
    };
    res.status(500).json(response);
  }
};

// Admin: Create new blog post
export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postData: CreateBlogPostRequest = req.body;

    // Validate required fields
    const requiredFields = ['title', 'content', 'coverImage'];
    const missingFields = validateRequiredFields(postData, requiredFields);
    
    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
      res.status(400).json(response);
      return;
    }

    // Validate cover image URL
    if (!isValidUrl(postData.coverImage)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid cover image URL'
      };
      res.status(400).json(response);
      return;
    }

    // Generate slug if not provided
    let slug = postData.slug || generateSlug(postData.title);
    
    const postsCollection = getPostsCollection();
    
    // Ensure slug is unique
    const isUnique = await isSlugUnique(postsCollection, slug);
    if (!isUnique) {
      slug = `${slug}-${Date.now()}`;
    }

    const now = Timestamp.now();
    const post: Omit<BlogPost, 'id'> = {
      ...postData,
      slug,
      tags: postData.tags || [],
      status: postData.status || 'draft',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await postsCollection.add(post);
    const createdPost: BlogPost = { id: docRef.id, ...post };

    const response: ApiResponse<BlogPost> = {
      success: true,
      data: createdPost,
      message: 'Blog post created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating post:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create post'
    };
    res.status(500).json(response);
  }
};

// Admin: Update blog post
export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateBlogPostRequest = req.body;

    const postsCollection = getPostsCollection();
    
    // Check if post exists
    const docRef = postsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Post not found'
      };
      res.status(404).json(response);
      return;
    }

    // Validate cover image URL if provided
    if (updateData.coverImage && !isValidUrl(updateData.coverImage)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid cover image URL'
      };
      res.status(400).json(response);
      return;
    }

    // Handle slug update
    if (updateData.slug) {
      const isUnique = await isSlugUnique(postsCollection, updateData.slug, id);
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
    const updatedPost: BlogPost = { id: updatedDoc.id, ...updatedDoc.data() } as BlogPost;

    const response: ApiResponse<BlogPost> = {
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating post:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update post'
    };
    res.status(500).json(response);
  }
};

// Admin: Delete blog post
export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const postsCollection = getPostsCollection();

    // Check if post exists
    const docRef = postsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const response: ApiResponse = {
        success: false,
        error: 'Post not found'
      };
      res.status(404).json(response);
      return;
    }

    await docRef.delete();

    const response: ApiResponse = {
      success: true,
      message: 'Blog post deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting post:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete post'
    };
    res.status(500).json(response);
  }
};