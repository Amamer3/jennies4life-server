# 👥 Admin Management Guide

This guide explains how to manage admin users, track dashboard access, and use all admin-related functionalities in the Jennies4life API.

## 📊 Dashboard Access Overview

The system tracks and manages admin users who have access to the dashboard with the following features:

- **User Creation**: Create new admin accounts
- **Access Control**: Enable/disable admin access
- **User Tracking**: Monitor who has dashboard access
- **Role Management**: Manage admin permissions
- **Activity Monitoring**: Track admin user statistics

## 🔧 Admin Management Methods

### 1. Command Line Script (Recommended for Initial Setup)

#### Create First Admin
```bash
# Create admin with email and password
npm run create-admin create admin@jennies4life.com mySecurePassword123 "Admin User"

# Or use environment variable for email
npm run create-admin create mySecurePassword123
```

#### List All Admins
```bash
npm run create-admin list
```

### 2. API Endpoints (For Dashboard Management)

Once you have at least one admin user, you can use the API endpoints to manage other admins.

## 🛠️ Available API Endpoints

### Authentication Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|----------|
| `/api/auth/login` | POST | No | Admin login |
| `/api/auth/logout` | POST | No | Admin logout |
| `/api/auth/verify` | GET | Yes | Verify authentication |
| `/api/auth/refresh` | POST | No | Refresh token |
| `/api/auth/profile` | GET | Yes | Get current admin profile |
| `/api/auth/exchange` | POST | No | Token exchange instructions |

### Admin Management Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|----------|
| `/api/admin/users` | POST | Yes | Create new admin user |
| `/api/admin/users` | GET | Yes | List all admin users |
| `/api/admin/users/:uid` | GET | Yes | Get specific admin user |
| `/api/admin/users/:uid` | PUT | Yes | Update admin user |
| `/api/admin/users/:uid` | DELETE | Yes | Delete admin user |
| `/api/admin/stats` | GET | Yes | Get dashboard statistics |

### Dashboard Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|----------|
| `/api/dashboard/stats` | GET | Yes | Get dashboard overview |
| `/api/dashboard/products` | GET | Yes | Get all products for admin |
| `/api/dashboard/posts` | GET | Yes | Get all posts for admin |
| `/api/dashboard/orders` | GET | Yes | Get recent orders |

## 📝 API Usage Examples

### 1. Create New Admin User

```javascript
// POST /api/admin/users
{
  "email": "newadmin@jennies4life.com",
  "password": "securePassword123",
  "displayName": "New Admin User"
}

// Response
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "uid": "firebase-uid-here",
    "email": "newadmin@jennies4life.com",
    "displayName": "New Admin User",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. List All Admin Users

```javascript
// GET /api/admin/users
// Response
{
  "success": true,
  "message": "Admin users retrieved successfully",
  "data": {
    "admins": [
      {
        "uid": "admin-uid-1",
        "email": "admin1@jennies4life.com",
        "displayName": "Admin One",
        "role": "admin",
        "permissions": ["read", "write", "delete"],
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "uid": "admin-uid-2",
        "email": "admin2@jennies4life.com",
        "displayName": "Admin Two",
        "role": "admin",
        "permissions": ["read", "write", "delete"],
        "isActive": false,
        "createdAt": "2024-01-14T09:15:00.000Z",
        "updatedAt": "2024-01-15T11:45:00.000Z"
      }
    ],
    "total": 2
  }
}
```

### 3. Update Admin User

```javascript
// PUT /api/admin/users/:uid
{
  "displayName": "Updated Admin Name",
  "isActive": false
}

// Response
{
  "success": true,
  "message": "Admin user updated successfully",
  "data": {
    "uid": "admin-uid-here",
    "email": "admin@jennies4life.com",
    "displayName": "Updated Admin Name",
    "role": "admin",
    "permissions": ["read", "write", "delete"],
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 4. Get Dashboard Statistics

```javascript
// GET /api/admin/stats
// Response
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalAdmins": 5,
    "activeAdmins": 4,
    "inactiveAdmins": 1,
    "recentAdmins": [
      {
        "uid": "recent-admin-1",
        "email": "recent1@jennies4life.com",
        "displayName": "Recent Admin",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

## 🔐 Admin User Permissions

Each admin user has the following permissions:

- **read**: View all content (products, posts, dashboard)
- **write**: Create and update content
- **delete**: Delete content and manage other admins

## 🛡️ Security Features

### Self-Protection
- Admins cannot delete their own account
- Admins cannot deactivate their own account
- Prevents accidental lockouts

### Access Control
- All admin management endpoints require authentication
- Firebase custom claims ensure proper role verification
- Firestore stores detailed admin profiles

### User States
- **Active**: Can access dashboard and perform admin actions
- **Inactive**: Account exists but cannot access dashboard
- **Deleted**: Account completely removed from system

## 📱 Frontend Integration

### Authentication Flow
1. Login with email/password → Get custom token
2. Exchange custom token for ID token using Firebase SDK
3. Use ID token for authenticated API requests
4. Implement token refresh for long sessions

### Example Frontend Code
```javascript
// Login and get admin list
async function loginAndGetAdmins() {
  // 1. Login
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jennies4life.com',
      password: 'password123'
    })
  });
  
  const { data } = await loginResponse.json();
  const customToken = data.customToken;
  
  // 2. Exchange for ID token
  const user = await firebase.auth().signInWithCustomToken(customToken);
  const idToken = await user.getIdToken();
  
  // 3. Get admin list
  const adminsResponse = await fetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const admins = await adminsResponse.json();
  console.log('Admin users:', admins.data.admins);
}
```

## 🚀 Getting Started

### Step 1: Create First Admin
```bash
npm run create-admin create admin@jennies4life.com mySecurePassword123 "Main Admin"
```

### Step 2: Test Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jennies4life.com","password":"mySecurePassword123"}'
```

### Step 3: Create Additional Admins
Use the `/api/admin/users` endpoint to create more admin users through the API.

### Step 4: Monitor Dashboard Access
Use `/api/admin/stats` to track how many users have dashboard access.

## 🔍 Monitoring Dashboard Access

### Who Has Access?
- Use `GET /api/admin/users` to see all admin users
- Check `isActive` field to see who can currently access the dashboard
- Use `GET /api/admin/stats` for quick overview

### Recent Activity
- The stats endpoint shows recently created admin users
- Monitor the `recentAdmins` array for new dashboard access grants

### Access Control
- Set `isActive: false` to revoke dashboard access without deleting the user
- Delete users completely if they should never have access again

## 📋 Best Practices

1. **Use Strong Passwords**: Enforce strong password policies for admin accounts
2. **Regular Audits**: Periodically review who has dashboard access
3. **Principle of Least Privilege**: Only give admin access to users who need it
4. **Monitor Activity**: Keep track of admin user creation and modifications
5. **Backup Admin**: Always maintain at least 2 active admin users
6. **Secure Storage**: Store admin credentials securely

## 🆘 Troubleshooting

### Cannot Create Admin
- Check Firebase configuration in `.env`
- Ensure Firebase project has Authentication enabled
- Verify admin email format

### Authentication Fails
- Check if user exists: `npm run create-admin list`
- Verify password is correct
- Check if user is active

### Permission Denied
- Ensure user has admin custom claims
- Check if authentication token is valid
- Verify user is not disabled in Firebase

## 📚 Related Documentation

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [API Documentation](http://localhost:3000/api/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin)