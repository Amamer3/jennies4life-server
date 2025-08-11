# Admin Management Scripts

This directory contains scripts for managing admin users in the Jennies4life API.

## Create Admin Script

The `createAdmin.ts` script helps you create and manage admin users in Firebase.

### Prerequisites

1. Ensure your `.env` file is properly configured with Firebase credentials
2. Make sure the `ADMIN_EMAIL` is set in your `.env` file
3. Install dependencies: `npm install`

### Usage

#### Create First Admin User

```bash
# Using the ADMIN_EMAIL from .env file
npm run create-admin create mySecurePassword123

# Or specify a custom email
npm run create-admin create admin@jennies4life.com mySecurePassword123 "Admin User"
```

#### List All Admin Users

```bash
npm run list-admins
```

### Command Reference

```bash
# Create admin with email from .env
npm run create-admin create <password> [displayName]

# Create admin with custom email
npm run create-admin create <email> <password> [displayName]

# List all admins
npm run create-admin list
```

### Examples

```bash
# Create admin using ADMIN_EMAIL from .env
npm run create-admin create SecurePass123

# Create admin with custom details
npm run create-admin create admin@jennies4life.com SecurePass123 "Main Admin"

# List all existing admins
npm run list-admins
```

### What the Script Does

1. **Creates Firebase User**: Creates a new user in Firebase Authentication
2. **Sets Admin Claims**: Assigns custom claims for admin role and permissions
3. **Creates Firestore Profile**: Stores admin profile data in Firestore
4. **Handles Existing Users**: If user exists, updates them with admin privileges

### Security Notes

- Use strong passwords for admin accounts
- Store passwords securely (consider using a password manager)
- The script will show the password in the output - clear your terminal history if needed
- Admin users have full access to create, read, update, and delete content

### Troubleshooting

#### Firebase Not Configured
If you see "Firebase credentials not configured", ensure your `.env` file has all required Firebase variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
# ... other Firebase variables
ADMIN_EMAIL=admin@jennies4life.com
```

#### User Already Exists
If the user already exists, the script will update them with admin privileges instead of creating a new user.

#### Permission Errors
Ensure your Firebase service account has the necessary permissions to create users and write to Firestore.