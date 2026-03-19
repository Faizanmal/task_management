/**
 * Auth Provider - Handles authentication context and logic
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authStorage, User, AuthTokens } from '@/lib/auth-storage';
import { apiClient } from '@/lib/api';
import { useToast } from '../context/toast-context';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, username: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const router = useRouter();

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = authStorage.getUser();
      const accessToken = authStorage.getAccessToken();

      if (storedUser && accessToken) {
        setUser(storedUser);
      } else {
        // Try to refresh if we have a refresh token
        const refreshToken = authStorage.getRefreshToken();
        if (refreshToken) {
          try {
            await refresh();
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Token refresh failed, clear auth
            authStorage.clear();
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (email: string, username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(email, username, password);

      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      authStorage.setAuth(tokens, response.user);
      setUser(response.user);
      addToast('Registration successful!', 'success');
      router.push('/tasks');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Registration failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);

      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      authStorage.setAuth(tokens, response.user);
      setUser(response.user);
      addToast('Login successful!', 'success');
      router.push('/tasks');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast(message || 'Login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }

      authStorage.clear();
      setUser(null);
      addToast('Logged out successfully', 'success');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth anyway
      authStorage.clear();
      setUser(null);
      router.push('/login');
    }
  };

  const refresh = async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.refresh(refreshToken);
      // Update access token
      const currentUser = authStorage.getUser();
      if (currentUser) {
        authStorage.setAuth(
          {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
          currentUser,
        );
      }
    } catch (error) {
      authStorage.clear();
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
