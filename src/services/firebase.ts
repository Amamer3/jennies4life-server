import admin from 'firebase-admin';
import dotenv from 'dotenv';

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

let auth: admin.auth.Auth | null = null;
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

    auth = admin.auth();
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.log('⚠️  Server will run without Firebase functionality');
  }
} else {
  console.log('⚠️  Firebase credentials not configured. Please update your .env file with valid Firebase credentials.');
  console.log('⚠️  Server will run without Firebase functionality for demonstration purposes.');
}

export { auth, db };
export default admin;