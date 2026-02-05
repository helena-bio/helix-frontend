/**
 * JWT token utilities with shared cookie domain
 */
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import type { JWTPayload } from '@/lib/types/auth';

const TOKEN_KEY = 'helix_access_token';
const TOKEN_EXPIRY_KEY = 'helix_token_expiry';

export const tokenUtils = {
  /**
   * Save token to cookies with shared domain
   */
  save(token: string): void {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const expiryDate = new Date(decoded.exp * 1000);
      
      const cookieOptions = {
        expires: expiryDate,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        domain: process.env.NODE_ENV === 'production' 
          ? '.helixinsight.bio'  // Shared across all subdomains
          : undefined,           // localhost for development
      };
      
      // Save token
      Cookies.set(TOKEN_KEY, token, cookieOptions);
      
      // Save expiry timestamp
      Cookies.set(TOKEN_EXPIRY_KEY, decoded.exp.toString(), cookieOptions);
    } catch (error) {
      console.error('Failed to save token:', error);
      throw new Error('Invalid token format');
    }
  },

  /**
   * Get token from cookies
   */
  get(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  },

  /**
   * Remove token from cookies
   */
  remove(): void {
    const removeOptions = {
      domain: process.env.NODE_ENV === 'production' 
        ? '.helixinsight.bio' 
        : undefined,
    };
    
    Cookies.remove(TOKEN_KEY, removeOptions);
    Cookies.remove(TOKEN_EXPIRY_KEY, removeOptions);
  },

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    const expiryStr = Cookies.get(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;
    
    const expiry = parseInt(expiryStr, 10);
    const now = Math.floor(Date.now() / 1000);
    
    return now >= expiry;
  },

  /**
   * Decode token payload
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
   * Check if token is valid
   */
  isValid(): boolean {
    const token = this.get();
    if (!token) return false;
    if (this.isExpired()) return false;
    
    return true;
  },
};
