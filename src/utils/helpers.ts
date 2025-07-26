/**
 * Generate a URL-friendly slug from a string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Check if a slug is unique in a collection
 */
export const isSlugUnique = async (
  collection: FirebaseFirestore.CollectionReference,
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const query = collection.where('slug', '==', slug);
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return true;
  }
  
  // If we're updating an existing document, exclude it from the check
  if (excludeId) {
    const docs = snapshot.docs.filter(doc => doc.id !== excludeId);
    return docs.length === 0;
  }
  
  return false;
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return missingFields;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};