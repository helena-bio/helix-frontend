/**
 * API client for backend communication
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenUtils } from '@/lib/auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

/**
 * Create axios instance with default config
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor - add auth token
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenUtils.get();
      
      if (token && tokenUtils.isValid()) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor - handle errors
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Token expired or invalid
      if (error.response?.status === 401) {
        tokenUtils.remove();
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/partners/login')) {
          window.location.href = '/partners/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

/**
 * API error response type
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.detail || error.message || 'An unexpected error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
