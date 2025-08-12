# Frontend Authentication Fix Guide

## 🐛 Issue Identified

Your frontend is receiving a successful login response but can't extract the custom token because it's looking in the wrong location.

### The Problem

**Frontend Error:**
```
🔐 AuthAPI - no custom token received from backend
```

**Root Cause:**
Your frontend code is trying to extract the custom token from `data.customToken`, but the server returns it at `data.data.customToken`.

### Server Response Structure

```json
{
  "success": true,
  "message": "Admin login successful. Use the custom token with Firebase client SDK to get an ID token.",
  "data": {
    "customToken": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "uid": "UW1cv09lKUbJn819wprrKeYHYQW2",
      "email": "admin@jennies4life.com",
      "displayName": "Main Admin",
      "role": "admin"
    },
    "instructions": {
      "message": "Exchange this custom token for an ID token using Firebase client SDK",
      "clientSideCode": "firebase.auth().signInWithCustomToken(customToken).then(userCredential => userCredential.user.getIdToken())"
    }
  }
}
```

## 🔧 Fix Required

### In your `authApi.ts` file (around line 85-91):

**BEFORE (Incorrect):**
```javascript
const customToken = data.customToken; // ❌ Wrong path
if (!customToken) {
    console.log('🔐 AuthAPI - no custom token received from backend');
    return { success: false, message: 'No custom token received from backend' };
}
```

**AFTER (Correct):**
```javascript
const customToken = data.data?.customToken; // ✅ Correct path
if (!customToken) {
    console.log('🔐 AuthAPI - no custom token received from backend');
    return { success: false, message: 'No custom token received from backend' };
}
```

### Alternative Approaches

**Option 1: Destructuring**
```javascript
const { data: responseData } = data;
const customToken = responseData?.customToken;
```

**Option 2: Direct access with validation**
```javascript
if (!data.data || !data.data.customToken) {
    console.log('🔐 AuthAPI - no custom token received from backend');
    return { success: false, message: 'No custom token received from backend' };
}
const customToken = data.data.customToken;
```

## 🚀 Complete Authentication Flow

Once you fix the token extraction, you'll need to implement the Firebase client SDK integration:

### 1. Install Firebase SDK (if not already installed)
```bash
npm install firebase
```

### 2. Initialize Firebase in your frontend
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### 3. Exchange Custom Token for ID Token
```javascript
// After successful login and extracting customToken
try {
  const userCredential = await signInWithCustomToken(auth, customToken);
  const idToken = await userCredential.user.getIdToken();
  
  // Store the ID token for API requests
  localStorage.setItem('auth_token', idToken);
  
  console.log('✅ Authentication successful');
  return { success: true, token: idToken, user: userCredential.user };
} catch (error) {
  console.error('❌ Token exchange failed:', error);
  return { success: false, message: 'Token exchange failed' };
}
```

### 4. Use ID Token for API Requests
```javascript
// For authenticated requests
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🧪 Testing the Fix

1. **Update your frontend code** to use `data.data.customToken`
2. **Test the login flow** - you should see the custom token being extracted successfully
3. **Implement Firebase SDK integration** for complete authentication

## 📝 Quick Fix Summary

**Immediate Fix (1 line change):**
```javascript
// Change this line in your authApi.ts:
const customToken = data.data?.customToken; // Instead of data.customToken
```

This will resolve the "no custom token received from backend" error and allow your authentication flow to proceed to the next step.

## 🔍 Debugging Tips

**Add logging to see the response structure:**
```javascript
console.log('🔍 Full login response:', data);
console.log('🔍 Response data:', data.data);
console.log('🔍 Custom token:', data.data?.customToken);
```

**Verify the server response:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jennies4life.com","password":"admin123"}'
```

This should help you confirm the exact response structure and verify the fix is working.