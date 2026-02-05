/**
 * Authentication API functions
 */
import { apiClient, getErrorMessage } from './client';
import { tokenUtils } from '@/lib/auth/token';
import type { LoginRequest, LoginResponse } from '@/lib/types/auth';

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = tokenUtils.get();
      
      if (token) {
        // Call backend to invalidate session
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always remove local token
      tokenUtils.remove();
    }
  },

  /**
   * Get current user (verify token)
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      // TODO: Implement /auth/me endpoint on backend if needed
      // const response = await apiClient.get<LoginResponse['user']>('/auth/me');
      // return response.data;
      return null;
    } catch (error) {
      return null;
    }
  },
};
