/**
 * Authentication context for managing user session
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenUtils } from '@/lib/auth/token';
import { authApi } from '@/lib/api/auth';
import type { User, LoginRequest, AuthState } from '@/lib/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Initialize auth state from stored token
   */
  useEffect(() => {
    const initAuth = () => {
      const token = tokenUtils.get();
      
      if (token && tokenUtils.isValid()) {
        setAuthState({
          user: null,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        tokenUtils.remove();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authApi.login(credentials);
      
      // Save token to shared cookie domain
      tokenUtils.save(response.access_token);
      
      // Update state
      setAuthState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Redirect to app subdomain
      const appUrl = process.env.NODE_ENV === 'production'
        ? 'https://app.helixinsight.bio'
        : 'http://localhost:3001'; // Assuming app runs on 3001 in dev
      
      window.location.href = appUrl;
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /**
   * Refresh auth state
   */
  const refreshAuth = useCallback(() => {
    const token = tokenUtils.get();
    
    if (token && tokenUtils.isValid()) {
      setAuthState(prev => ({
        ...prev,
        token,
        isAuthenticated: true,
      }));
    } else {
      tokenUtils.remove();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
