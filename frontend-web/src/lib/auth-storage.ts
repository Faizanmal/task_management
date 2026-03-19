/**
 * Authentication utility functions
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const authStorage = {
  // Store tokens and user info
  setAuth(tokens: AuthTokens, user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  // Get current user
  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  // Get access token
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },

  // Get refresh token
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Clear all auth data
  clear() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
};
