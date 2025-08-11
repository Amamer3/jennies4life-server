import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

interface CreateAdminOptions {
  email: string;
  password: string;
  displayName?: string;
}

class AdminCreator {
  private auth: admin.auth.Auth;
  private db: admin.firestore.Firestore;

  constructor() {
    this.initializeFirebase();
    this.auth = admin.auth();
    this.db = admin.firestore();
  }

  private initializeFirebase(): void {
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

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async createAdmin(options: CreateAdminOptions): Promise<void> {
    try {
      console.log('🔄 Creating admin user...');

      // Check if user already exists
      try {
        const existingUser = await this.auth.getUserByEmail(options.email);
        console.log('⚠️  User already exists with UID:', existingUser.uid);
        
        // Update existing user to ensure they have admin privileges
        await this.updateUserToAdmin(existingUser.uid, options);
        return;
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
        // User doesn't exist, continue with creation
      }

      // Create new user
      const userRecord = await this.auth.createUser({
        email: options.email,
        password: options.password,
        displayName: options.displayName || 'Admin User',
        emailVerified: true,
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', userRecord.email);
      console.log('🆔 UID:', userRecord.uid);

      // Set custom claims for admin role
      await this.auth.setCustomUserClaims(userRecord.uid, {
        admin: true,
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      });

      console.log('✅ Admin privileges set successfully!');

      // Create admin profile in Firestore
      await this.createAdminProfile(userRecord.uid, options);

      console.log('🎉 Admin user setup completed!');
      console.log('\n📋 Admin Details:');
      console.log(`   Email: ${options.email}`);
      console.log(`   Password: ${options.password}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log('\n🔐 You can now use these credentials to login to the admin panel.');

    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      throw error;
    }
  }

  private async updateUserToAdmin(uid: string, options: CreateAdminOptions): Promise<void> {
    try {
      // Set custom claims for admin role
      await this.auth.setCustomUserClaims(uid, {
        admin: true,
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      });

      console.log('✅ Existing user updated with admin privileges!');

      // Update admin profile in Firestore
      await this.createAdminProfile(uid, options);

      console.log('🎉 Existing user setup as admin completed!');
    } catch (error) {
      console.error('❌ Error updating user to admin:', error);
      throw error;
    }
  }

  private async createAdminProfile(uid: string, options: CreateAdminOptions): Promise<void> {
    try {
      const adminProfile = {
        uid,
        email: options.email,
        displayName: options.displayName || 'Admin User',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await this.db.collection('admins').doc(uid).set(adminProfile);
      console.log('✅ Admin profile created in Firestore!');
    } catch (error) {
      console.error('❌ Error creating admin profile:', error);
      // Don't throw here as the user creation was successful
    }
  }

  async listAdmins(): Promise<void> {
    try {
      console.log('🔍 Listing all admin users...');
      
      const adminsSnapshot = await this.db.collection('admins').get();
      
      if (adminsSnapshot.empty) {
        console.log('📭 No admin users found.');
        return;
      }

      console.log('\n👥 Admin Users:');
      adminsSnapshot.forEach((doc) => {
        const admin = doc.data();
        console.log(`   📧 ${admin.email} (UID: ${admin.uid})`);
      });
    } catch (error) {
      console.error('❌ Error listing admins:', error);
    }
  }
}

// CLI Interface
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    const adminCreator = new AdminCreator();

    switch (command) {
      case 'create':
        const email = args[1] || process.env.ADMIN_EMAIL;
        const password = args[2];
        const displayName = args[3];

        if (!email || !password) {
          console.error('❌ Usage: npm run create-admin create <email> <password> [displayName]');
          console.error('   Or set ADMIN_EMAIL in .env and run: npm run create-admin create <password>');
          process.exit(1);
        }

        await adminCreator.createAdmin({
          email,
          password,
          displayName
        });
        break;

      case 'list':
        await adminCreator.listAdmins();
        break;

      default:
        console.log('🚀 Jennies4life Admin Creator');
        console.log('\nUsage:');
        console.log('  npm run create-admin create <email> <password> [displayName]');
        console.log('  npm run create-admin list');
        console.log('\nExamples:');
        console.log('  npm run create-admin create admin@jennies4life.com mySecurePassword123 "Admin User"');
        console.log('  npm run create-admin list');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AdminCreator };