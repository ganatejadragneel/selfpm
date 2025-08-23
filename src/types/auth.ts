// Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthUser {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface AuthError {
  message: string;
  code?: string;
}