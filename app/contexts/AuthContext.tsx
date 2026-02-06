/**
 * Authentication Context for App
 *
 * Manages user session state using cookie-based JWT tokens.
 * Compatible with marketing site authentication (shared cookie domain).
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tokenUtils } from '@/lib/auth/token';
import type { JWTPayload } from '@/lib/auth/token';

interface User {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
  organization_id: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Initialize auth state from stored cookie token.
   */
  useEffect(() => {
    if (tokenUtils.isValid()) {
      const payload = tokenUtils.decode();

      setAuthState({
        user: payload ? {
          id: payload.sub,
          email: '',
          full_name: '',
          organization_name: '',
          organization_id: payload.org_id,
          role: '',
        } : null,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      tokenUtils.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /**
   * Logout -- invalidate session on backend, clear cookie, redirect.
   */
  const logout = useCallback(async () => {
    try {
      const token = tokenUtils.get();

      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Backend logout failure is non-blocking
        });
      }
    } finally {
      tokenUtils.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh auth state from cookie.
   */
  const refreshAuth = useCallback(() => {
    if (tokenUtils.isValid()) {
      const payload = tokenUtils.decode();
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: payload ? {
          ...prev.user,
          id: payload.sub,
          organization_id: payload.org_id,
        } as User : prev.user,
      }));
    } else {
      tokenUtils.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const value: AuthContextType = {
    ...authState,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
