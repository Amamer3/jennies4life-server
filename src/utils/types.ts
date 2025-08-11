import { Timestamp } from 'firebase-admin/firestore';

export interface Product {
  id?: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  affiliateLink: string;
  category: string;
  status: 'draft' | 'published';
  clickCount?: number;
  lastClickedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  image: string;
  description: string;
  affiliateLink: string;
  category: string;
  status: 'draft' | 'published';
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  image?: string;
  description?: string;
  affiliateLink?: string;
  category?: string;
  status?: 'draft' | 'published';
}

export interface CreateBlogPostRequest {
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: 'draft' | 'published';
}

export interface UpdateBlogPostRequest {
  title?: string;
  slug?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

export interface ClickEvent {
  id?: string;
  productId: string;
  productSlug: string;
  userIP?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: Timestamp;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}