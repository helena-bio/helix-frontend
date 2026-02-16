/**
 * JWT Token Utilities
 *
 * Cookie-based token management shared with marketing site.
 * Uses same cookie domain (.helixinsight.bio) so login from
 * marketing site carries over to app seamlessly.
 *
 * Access token: short-lived (30 min), stored in cookie.
 * Refresh token: long-lived (7 days), stored in cookie.
 * On access token expiry, client.ts silently refreshes.
 */
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'helix_access_token';
const TOKEN_EXPIRY_KEY = 'helix_token_expiry';
const REFRESH_TOKEN_KEY = 'helix_refresh_token';

export interface JWTPayload {
  sub: string;
  org_id: string;
  email: string;
  full_name: string;
  role: string;
  is_platform_admin: boolean;
  impersonating?: boolean;
  real_org_id?: string;
  exp: number;
  iat: number;
  type: string;
}

function getCookieOptions(expiryDate?: Date) {
  return {
    expires: expiryDate,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    domain: process.env.NODE_ENV === 'production'
      ? '.helixinsight.bio'
      : undefined,
  };
}

function getRemoveOptions() {
  return {
    domain: process.env.NODE_ENV === 'production'
      ? '.helixinsight.bio'
      : undefined,
  };
}

export const tokenUtils = {
  /**
   * Save access token to cookie with shared domain.
   */
  save(token: string): void {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const expiryDate = new Date(decoded.exp * 1000);

      Cookies.set(TOKEN_KEY, token, getCookieOptions(expiryDate));
      Cookies.set(TOKEN_EXPIRY_KEY, decoded.exp.toString(), getCookieOptions(expiryDate));
    } catch (error) {
      console.error('Failed to save token:', error);
      throw new Error('Invalid token format');
    }
  },

  /**
   * Save refresh token to cookie.
   * Expiry derived from refresh token JWT exp claim.
   */
  saveRefreshToken(token: string): void {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const expiryDate = new Date(decoded.exp * 1000);
      Cookies.set(REFRESH_TOKEN_KEY, token, getCookieOptions(expiryDate));
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  },

  /**
   * Get access token from cookie.
   */
  get(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  },

  /**
   * Get refresh token from cookie.
   */
  getRefreshToken(): string | null {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  /**
   * Remove all auth tokens from cookies.
   */
  remove(): void {
    const opts = getRemoveOptions();
    Cookies.remove(TOKEN_KEY, opts);
    Cookies.remove(TOKEN_EXPIRY_KEY, opts);
    Cookies.remove(REFRESH_TOKEN_KEY, opts);

    // Clean up legacy localStorage token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('helix_auth_token');
      localStorage.removeItem('userName');
    }
  },

  /**
   * Check if access token is expired.
   */
  isExpired(): boolean {
    const expiryStr = Cookies.get(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiry = parseInt(expiryStr, 10);
    const now = Math.floor(Date.now() / 1000);

    return now >= expiry;
  },

  /**
   * Seconds until access token expires. Negative if already expired.
   */
  secondsUntilExpiry(): number {
    const expiryStr = Cookies.get(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return -1;

    const expiry = parseInt(expiryStr, 10);
    const now = Math.floor(Date.now() / 1000);
    return expiry - now;
  },

  /**
   * Decode token payload.
   */
  decode(): JWTPayload | null {
    const token = this.get();
    if (!token) return null;

    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if access token exists and is not expired.
   */
  isValid(): boolean {
    const token = this.get();
    if (!token) return false;
    if (this.isExpired()) return false;
    return true;
  },

  /**
   * Check if refresh token exists and is not expired.
   */
  hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      return now < decoded.exp;
    } catch {
      return false;
    }
  },
};
