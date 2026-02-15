/**
 * Authentication Context for App
 *
 * Manages user session state using cookie-based JWT tokens.
 * Compatible with marketing site authentication (shared cookie domain).
 *
 * IMPERSONATION:
 * Platform admins can switch to another organization's context.
 * Original token is stored in sessionStorage (cleared on tab close).
 * Auth state updates to reflect the target org while impersonating.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tokenUtils } from '@/lib/auth/token';
import type { JWTPayload } from '@/lib/auth/token';
import { platformApi } from '@/lib/api/platform';

const ORIGINAL_TOKEN_KEY = 'helix_original_token';

interface User {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
  organization_id: string;
  role: string;
  is_platform_admin: boolean;
}

interface ImpersonationState {
  active: boolean;
  organizationName: string;
  organizationId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  avatarVersion: number;
  bumpAvatarVersion: () => void;
  impersonation: ImpersonationState;
  switchOrganization: (orgId: string) => Promise<void>;
  exitSwitch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

/**
 * Build User object from JWT payload.
 * All identity fields are now embedded in the token.
 */
function userFromPayload(payload: JWTPayload): User {
  return {
    id: payload.sub,
    email: payload.email || '',
    full_name: payload.full_name || '',
    organization_name: '',
    organization_id: payload.org_id,
    role: payload.role || '',
    is_platform_admin: payload.is_platform_admin || false,
  };
}

/**
 * Detect impersonation state from current JWT.
 */
function getImpersonationFromPayload(payload: JWTPayload | null): ImpersonationState {
  if (!payload || !payload.impersonating) {
    return { active: false, organizationName: '', organizationId: '' };
  }
  return {
    active: true,
    organizationName: '',
    organizationId: payload.org_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [avatarVersion, setAvatarVersion] = useState(1);
  const [impersonation, setImpersonation] = useState<ImpersonationState>({
    active: false,
    organizationName: '',
    organizationId: '',
  });

  /**
   * Initialize auth state from stored cookie token.
   */
  useEffect(() => {
    if (tokenUtils.isValid()) {
      const payload = tokenUtils.decode();

      setAuthState({
        user: payload ? userFromPayload(payload) : null,
        isAuthenticated: true,
        isLoading: false,
      });

      // Restore impersonation state if token has impersonating claim
      if (payload) {
        setImpersonation(getImpersonationFromPayload(payload));
      }
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
      // Clean up impersonation state
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ORIGINAL_TOKEN_KEY);
      }
      setImpersonation({ active: false, organizationName: '', organizationId: '' });
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
      setAuthState({
        user: payload ? userFromPayload(payload) : null,
        isAuthenticated: true,
        isLoading: false,
      });
      if (payload) {
        setImpersonation(getImpersonationFromPayload(payload));
      }
    } else {
      tokenUtils.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setImpersonation({ active: false, organizationName: '', organizationId: '' });
    }
  }, []);

  /**
   * Update user state directly (e.g. after profile edit).
   * Does not change JWT -- next login will get fresh token.
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  /**
   * Increment avatar version to bust cache across all components.
   */
  const bumpAvatarVersion = useCallback(() => {
    setAvatarVersion((v) => v + 1);
  }, []);

  /**
   * Switch platform admin context to target organization.
   *
   * 1. Store current token in sessionStorage (cleared on tab close)
   * 2. Call backend to get impersonation token
   * 3. Save new token to cookie
   * 4. Update auth state to reflect target org
   * 5. Navigate to dashboard
   */
  const switchOrganization = useCallback(async (orgId: string) => {
    const currentToken = tokenUtils.get();
    if (!currentToken) throw new Error('No active session');

    // Store original token for exit
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ORIGINAL_TOKEN_KEY, currentToken);
    }

    const result = await platformApi.switchOrganization(orgId);

    // Save impersonation token
    tokenUtils.save(result.token);

    // Update auth state
    setAuthState({
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        organization_name: result.organization.name,
        organization_id: result.organization.id,
        role: result.user.role,
        is_platform_admin: result.user.is_platform_admin,
      },
      isAuthenticated: true,
      isLoading: false,
    });

    setImpersonation({
      active: true,
      organizationName: result.organization.name,
      organizationId: result.organization.id,
    });

    // Navigate to dashboard of target org
    router.push('/');
  }, [router]);

  /**
   * Exit impersonation and return to admin's real organization.
   *
   * Strategy: restore original token from sessionStorage.
   * Falls back to backend exit endpoint if sessionStorage is empty.
   */
  const exitSwitch = useCallback(async () => {
    let restoredToken: string | null = null;

    // Try sessionStorage first (instant, no network)
    if (typeof window !== 'undefined') {
      restoredToken = sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
      sessionStorage.removeItem(ORIGINAL_TOKEN_KEY);
    }

    if (restoredToken) {
      // Restore original token directly
      tokenUtils.save(restoredToken);
    } else {
      // Fallback: ask backend for new token scoped to real org
      const result = await platformApi.exitSwitch();
      tokenUtils.save(result.token);
    }

    // Refresh auth state from restored token
    const payload = tokenUtils.decode();
    setAuthState({
      user: payload ? userFromPayload(payload) : null,
      isAuthenticated: true,
      isLoading: false,
    });

    setImpersonation({ active: false, organizationName: '', organizationId: '' });

    // Navigate back to platform
    router.push('/platform');
  }, [router]);

  const value: AuthContextType = {
    ...authState,
    logout,
    refreshAuth,
    updateUser,
    avatarVersion,
    bumpAvatarVersion,
    impersonation,
    switchOrganization,
    exitSwitch,
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
