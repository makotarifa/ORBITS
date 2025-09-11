/// <reference types="vite/client" />

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Auth types
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterApiRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    experience: number;
    isActive: boolean;
    createdAt: Date;
  };
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    experience: number;
    isActive: boolean;
    createdAt: Date;
  };
}

// Form validation types
export interface FormFieldError {
  message: string;
}

export interface FormErrors {
  email?: FormFieldError;
  username?: FormFieldError;
  password?: FormFieldError;
  confirmPassword?: FormFieldError;
  general?: FormFieldError;
}