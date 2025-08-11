# Authentication System Guide

## 🚨 Critical Issue: Token Flow Mismatch

Your automatic logout problem is caused by a **token flow mismatch**:

- **Backend**: Returns Firebase custom tokens from login
- **Frontend**: Needs Firebase ID tokens for authentication  
- **Missing Link**: Custom tokens must be exchanged for ID tokens using Firebase client SDK

## ⚠️ Current Issue: Frontend Authentication Errors

Your frontend is making requests to `/api/auth/verify` with invalid tokens, causing continuous authentication failures. This happens when:

1. **Stored tokens are invalid/expired** - Clear browser storage
2. **Frontend sends custom tokens instead of ID tokens** - Implement proper token exchange
3. **No proper error handling** - Frontend keeps retrying with bad tokens

### 🚀 Immediate Fix: Stop Authentication Errors

**Step 1: Clear Browser Storage**
```javascript
// Run this in browser console to clear stored tokens
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Step 2: Check Your Frontend Code**
Look for code that:
- Calls `/api/auth/verify` on page load
- Makes repeated authentication requests
- Stores and sends invalid tokens

**Step 3: Test the Fix**
- Open `test-auth-flow.html` to see proper authentication flow
- Use `frontend-fix-example.js` as a reference for fixing your frontend

### 📁 New Files Created
- `test-auth-flow.html` - Interactive authentication flow test
- `frontend-fix-example.js` - Proper frontend authentication implementation

## 🔧 Backend Changes Applied

### Enhanced Authentication Middleware
- ✅ Added comprehensive error logging
- ✅ Improved custom token validation logic
- ✅ Added token expiration checks
- ✅ Better error handling for different token types

### New Token Exchange Endpoint
- ✅ Added `POST /api/auth/exchange` endpoint
- ✅ Provides instructions for client-side token exchange

### Fixed Logout Flow
- ✅ Made logout endpoint public (no auth required)
- ✅ Prevents authentication loops during logout

### Frontend Implementation Required

🔄 **Proper Authentication Flow**

```javascript
// 1. Login and get custom token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { customToken } = await loginResponse.json();

// 2. Exchange custom token for ID token using Firebase client SDK
import { signInWithCustomToken, getAuth } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithCustomToken(auth, customToken);
const idToken = await userCredential.user.getIdToken();

// 3. Use ID token for authenticated requests
const headers = {
  'Authorization': `Bearer ${idToken}`,
  'Content-Type': 'application/json'
};
```

🔄 **Token Refresh Strategy**

```javascript
// Set up automatic token refresh
auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Store token for API requests
    localStorage.setItem('authToken', token);
  } else {
    // User logged out
    localStorage.removeItem('authToken');
  }
});
```

## 🛠️ Available Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|----------|
| `/api/auth/login` | POST | No | Get custom token |
| `/api/auth/exchange` | POST | No | Token exchange instructions |
| `/api/auth/refresh` | POST | No | Refresh tokens |
| `/api/auth/verify` | GET | Yes | Verify authentication |
| `/api/auth/logout` | POST | No | Logout (client-side cleanup) |
| `/api/auth/profile` | GET | Yes | Get user profile |

## 🔍 Debugging Authentication Issues

### Check Server Logs
The server now provides detailed logging for authentication failures:

```bash
npm run dev
# Watch for authentication error messages
```

### Common Issues

1. **"Invalid or expired token"**
   - Token has expired
   - Using custom token instead of ID token
   - Solution: Refresh token or re-login

2. **"Admin access required"**
   - User doesn't have admin privileges
   - Solution: Ensure user has admin custom claims

3. **"Authorization header required"**
   - Missing Bearer token in request
   - Solution: Include `Authorization: Bearer <id_token>` header

## 🚀 Next Steps

1. **Update Frontend**: Implement proper Firebase client SDK integration
2. **Token Management**: Set up automatic token refresh
3. **Error Handling**: Handle authentication errors gracefully
4. **Testing**: Test the complete authentication flow

## 📚 Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Custom Tokens Guide](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [ID Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

---

**Note**: The automatic logout issue should be resolved once the frontend properly implements the Firebase client SDK token exchange flow.