import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if Firebase credentials are properly configured
const isFirebaseConfigured = () => {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];
  
  return requiredEnvVars.every(envVar => {
    const value = process.env[envVar];
    return value && value !== 'your-project-id' && value !== 'your-private-key' && value !== 'firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com';
  });
};

let db: admin.firestore.Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    process.exit(1);
  }
} else {
  console.error('❌ Firebase credentials not configured. Please update your .env file with valid Firebase credentials.');
  process.exit(1);
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Categories to create
const categories = [
  {
    name: 'Health & Wellness',
    description: 'Products and services focused on improving physical and mental well-being, including supplements, fitness equipment, and wellness programs.'
  },
  {
    name: 'Electronics',
    description: 'Latest technology gadgets, devices, and electronic accessories for home, work, and entertainment.'
  },
  {
    name: 'Fashion & Style',
    description: 'Trendy clothing, accessories, and fashion items for all occasions and personal style preferences.'
  },
  {
    name: 'Home & Garden',
    description: 'Everything for your home improvement, decoration, gardening, and outdoor living spaces.'
  },
  {
    name: 'Sports & Fitness',
    description: 'Athletic gear, fitness equipment, sportswear, and accessories for active lifestyles and sports enthusiasts.'
  },
  {
    name: 'Beauty & Care',
    description: 'Skincare, cosmetics, personal care products, and beauty tools for self-care and grooming routines.'
  }
];

async function createCategories() {
  try {
    if (!db) {
      console.error('❌ Database not initialized');
      process.exit(1);
    }
    
    console.log('🚀 Starting category creation process...');
    
    for (const category of categories) {
      const slug = generateSlug(category.name);
      
      // Check if category already exists
      const existingCategory = await db.collection('categories')
        .where('slug', '==', slug)
        .get();
      
      if (!existingCategory.empty) {
        console.log(`⚠️  Category "${category.name}" already exists, skipping...`);
        continue;
      }
      
      // Create new category
      const categoryData = {
        name: category.name,
        slug: slug,
        description: category.description,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await db.collection('categories').add(categoryData);
      console.log(`✅ Created category "${category.name}" with ID: ${docRef.id}`);
    }
    
    console.log('🎉 Category creation completed successfully!');
    
    // List all categories
    console.log('\n📋 Current categories in database:');
    const allCategories = await db.collection('categories')
      .orderBy('name')
      .get();
    
    allCategories.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.slug}) - Status: ${data.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating categories:', error);
    process.exit(1);
  }
}

// Run the script
createCategories().then(() => {
  console.log('\n✨ Script execution completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});