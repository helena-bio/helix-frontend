/**
 * Authentication Context for App
 *
 * Manages user session state using cookie-based JWT tokens.
 * Compatible with marketing site authentication (shared cookie domain).
 *
 * REFRESH STRATEGY:
 * A proactive timer fires at 80% of access token lifetime (24 min for 30 min tokens).
 * On fire, it calls POST /auth/refresh with the stored refresh token.
 * This keeps the session alive transparently while the user is active.
 * The refresh token itself lasts 7 days -- the session survives browser restarts.
 *
 * IMPERSONATION:
 * Platform admins can switch to another organization's context.
 * Original token is stored in sessionStorage (cleared on tab close).
 * Auth state updates to reflect the target org while impersonating.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { tokenUtils } from '@/lib/auth/token';
import type { JWTPayload } from '@/lib/auth/token';
import { platformApi } from '@/lib/api/platform';

const ORIGINAL_TOKEN_KEY = 'helix_original_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

/** Refresh at 80% of token lifetime (e.g., 24 min for 30 min tokens). */
const REFRESH_THRESHOLD = 0.8;

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

/**
 * Build User object from JWT payload.
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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clear the proactive refresh timer.
   */
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Perform a silent token refresh.
   * Called proactively by timer and reactively on auth init with near-expiry tokens.
   */
  const performSilentRefresh = useCallback(async () => {
    const refreshToken = tokenUtils.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      tokenUtils.save(data.access_token);
      if (data.refresh_token) {
        tokenUtils.saveRefreshToken(data.refresh_token);
      }

      // Update auth state with potentially refreshed user data
      const payload = tokenUtils.decode();
      if (payload) {
        setAuthState({
          user: userFromPayload(payload),
          isAuthenticated: true,
          isLoading: false,
        });
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Schedule the next proactive refresh.
   * Fires at 80% of remaining access token lifetime.
   */
  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer();

    const secondsLeft = tokenUtils.secondsUntilExpiry();
    if (secondsLeft <= 0) return;

    // Schedule at 80% of lifetime (e.g., 24 min into a 30 min token)
    const delayMs = Math.max(secondsLeft * REFRESH_THRESHOLD * 1000, 10_000);

    refreshTimerRef.current = setTimeout(async () => {
      const success = await performSilentRefresh();
      if (success) {
        scheduleRefresh(); // Schedule next refresh
      }
    }, delayMs);
  }, [clearRefreshTimer, performSilentRefresh]);

  /**
   * Initialize auth state from stored cookie token.
   */
  useEffect(() => {
    const init = async () => {
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
        scheduleRefresh();
      } else if (tokenUtils.hasValidRefreshToken()) {
        // Access token expired but refresh token is still valid -- refresh now
        const success = await performSilentRefresh();
        if (success) {
          scheduleRefresh();
        } else {
          tokenUtils.remove();
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        tokenUtils.remove();
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    init();

    return () => clearRefreshTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Logout -- invalidate session on backend, clear cookies, redirect.
   */
  const logout = useCallback(async () => {
    clearRefreshTimer();

    try {
      const token = tokenUtils.get();
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
      }
    } finally {
      tokenUtils.remove();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ORIGINAL_TOKEN_KEY);
      }
      setImpersonation({ active: false, organizationName: '', organizationId: '' });
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      router.push('/login');
    }
  }, [router, clearRefreshTimer]);

  /**
   * Refresh auth state from cookie and reschedule timer.
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
      scheduleRefresh();
    } else {
      tokenUtils.remove();
      clearRefreshTimer();
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      setImpersonation({ active: false, organizationName: '', organizationId: '' });
    }
  }, [scheduleRefresh, clearRefreshTimer]);

  /**
   * Update user state directly (e.g. after profile edit).
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
   */
  const switchOrganization = useCallback(async (orgId: string) => {
    const currentToken = tokenUtils.get();
    if (!currentToken) throw new Error('No active session');

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ORIGINAL_TOKEN_KEY, currentToken);
    }

    const result = await platformApi.switchOrganization(orgId);
    tokenUtils.save(result.token);

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

    scheduleRefresh();
    router.push('/');
  }, [router, scheduleRefresh]);

  /**
   * Exit impersonation and return to admin's real organization.
   */
  const exitSwitch = useCallback(async () => {
    let restoredToken: string | null = null;

    if (typeof window !== 'undefined') {
      restoredToken = sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
      sessionStorage.removeItem(ORIGINAL_TOKEN_KEY);
    }

    if (restoredToken) {
      tokenUtils.save(restoredToken);
    } else {
      const result = await platformApi.exitSwitch();
      tokenUtils.save(result.token);
    }

    const payload = tokenUtils.decode();
    setAuthState({
      user: payload ? userFromPayload(payload) : null,
      isAuthenticated: true,
      isLoading: false,
    });

    setImpersonation({ active: false, organizationName: '', organizationId: '' });
    scheduleRefresh();
    router.push('/platform');
  }, [router, scheduleRefresh]);

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
