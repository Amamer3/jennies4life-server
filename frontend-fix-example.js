/**
 * Frontend Authentication Fix Example
 * 
 * This example shows how to properly handle authentication
 * to prevent the automatic logout issue.
 */

class AuthManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.tokenKey = 'auth_token';
        this.isAuthenticating = false;
    }

    /**
     * Get stored token from localStorage
     */
    getStoredToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Store token in localStorage
     */
    storeToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
        } else {
            localStorage.removeItem(this.tokenKey);
        }
    }

    /**
     * Clear all authentication data
     */
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        // Clear any other auth-related storage
        localStorage.removeItem('user');
        localStorage.removeItem('customToken');
        localStorage.removeItem('idToken');
    }

    /**
     * Login with email and password
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // FIXED: Extract custom token from correct path (data.data.customToken)
                const customToken = data.data?.customToken;
                
                if (!customToken) {
                    throw new Error('No custom token received from backend');
                }
                
                // TODO: Exchange custom token for ID token using Firebase SDK
                // For now, we'll store the custom token (this will cause auth errors)
                // this.storeToken(customToken);
                
                console.log('Login successful, but token exchange needed');
                console.log('Custom token received:', customToken.substring(0, 50) + '...');
                
                return { success: true, customToken, needsExchange: true };
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout (clear local storage and call logout endpoint)
     */
    async logout() {
        try {
            // Clear local storage first
            this.clearAuth();
            
            // Call logout endpoint (it's public, so no auth needed)
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Logout successful');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if the API call fails, we've cleared local storage
            return { success: true };
        }
    }

    /**
     * Check if user is authenticated (WITHOUT making API calls)
     */
    isAuthenticated() {
        const token = this.getStoredToken();
        return !!token;
    }

    /**
     * Verify authentication with server (use sparingly)
     */
    async verifyAuth() {
        const token = this.getStoredToken();
        
        if (!token) {
            return { authenticated: false, reason: 'No token stored' };
        }

        // Prevent multiple simultaneous auth checks
        if (this.isAuthenticating) {
            return { authenticated: false, reason: 'Auth check in progress' };
        }

        try {
            this.isAuthenticating = true;
            
            const response = await fetch(`${this.apiBase}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { authenticated: true, user: data.user };
            } else {
                // Token is invalid, clear it
                console.log('Token verification failed, clearing auth');
                this.clearAuth();
                return { authenticated: false, reason: 'Invalid token' };
            }
        } catch (error) {
            console.error('Auth verification error:', error);
            // Don't clear auth on network errors
            return { authenticated: false, reason: 'Network error' };
        } finally {
            this.isAuthenticating = false;
        }
    }

    /**
     * Make authenticated API request
     */
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getStoredToken();
        
        if (!token) {
            throw new Error('No authentication token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // If unauthorized, clear auth and throw error
        if (response.status === 401) {
            console.log('Request unauthorized, clearing auth');
            this.clearAuth();
            throw new Error('Authentication required');
        }

        return response;
    }
}

// Usage example:
const auth = new AuthManager();

// Example of proper authentication flow
async function handleLogin(email, password) {
    try {
        const result = await auth.login(email, password);
        
        if (result.needsExchange) {
            console.log('⚠️ Token exchange required!');
            console.log('You need to implement Firebase SDK token exchange');
            console.log('See AUTHENTICATION_GUIDE.md for details');
            
            // For now, don't store the custom token to prevent auth errors
            // Instead, show user that they need proper Firebase integration
            alert('Login successful, but Firebase SDK integration required for full authentication');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
}

// Example of checking auth status WITHOUT causing server errors
function checkAuthStatus() {
    if (auth.isAuthenticated()) {
        console.log('User appears to be logged in');
        // Only verify with server when necessary (e.g., before important actions)
    } else {
        console.log('User not logged in');
    }
}

// Example of making authenticated requests safely
async function fetchUserData() {
    try {
        const response = await auth.makeAuthenticatedRequest('/api/auth/profile');
        const userData = await response.json();
        console.log('User data:', userData);
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Handle auth error (user will be automatically logged out)
    }
}

// IMPORTANT: Don't call auth.verifyAuth() repeatedly or on page load
// This causes the continuous authentication errors you're experiencing

// BAD - Don't do this:
// setInterval(() => auth.verifyAuth(), 5000); // This causes auth errors!
// window.onload = () => auth.verifyAuth(); // This too!

// GOOD - Only verify when needed:
// - Before important actions
// - When user explicitly requests it
// - After login/logout

export default AuthManager;