/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
  organization_id: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface JWTPayload {
  sub: string; // user_id
  org_id: string;
  exp: number;
  iat: number;
  type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
