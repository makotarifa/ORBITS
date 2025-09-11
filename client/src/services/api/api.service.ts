import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../../types/auth';
import { GAME_CONSTANTS } from '../../constants/game.constants';
import { tokenService } from '../token/token.service';

class ApiService {
  private readonly axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || GAME_CONSTANTS.DEFAULTS.API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = tokenService.getToken();
        if (token && !tokenService.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(new Error(error.message || 'Request interceptor error'));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch(err => {
              return Promise.reject(new Error(err.message || 'Queued request failed'));
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          // Try to refresh token using fetch directly to avoid circular dependency
          const refreshToken = tokenService.getRefreshToken();
          if (!refreshToken) {
            this.processQueue(error, null);
            return Promise.reject(new Error('No refresh token available'));
          }

          try {
            const baseURL = import.meta.env.VITE_API_URL || GAME_CONSTANTS.DEFAULTS.API_URL;
            const response = await fetch(`${baseURL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data?.access_token) {
                const newToken = data.data.access_token;
                tokenService.setTokens(newToken);

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Process queued requests
                this.processQueue(null, newToken);

                return this.axiosInstance(originalRequest);
              }
            }

            // Refresh failed
            tokenService.clearTokens();
            this.processQueue(error, null);
            return Promise.reject(new Error('Token refresh failed'));
          } catch {
            tokenService.clearTokens();
            this.processQueue(error, null);
            return Promise.reject(new Error('Token refresh failed'));
          }
        }

        // Handle other errors
        return Promise.reject(new Error(error.response?.data?.message || error.message || 'Response error'));
      }
    );
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });

    this.failedQueue = [];
    this.isRefreshing = false;
  }

  // Generic request methods
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        errors: error.response?.data?.errors,
      };
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        errors: error.response?.data?.errors,
      };
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        errors: error.response?.data?.errors,
      };
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        errors: error.response?.data?.errors,
      };
    }
  }
}

export const apiService = new ApiService();