import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../../types/auth';
import { GAME_CONSTANTS } from '../../constants/game.constants';

class ApiService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || GAME_CONSTANTS.DEFAULTS.API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
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
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Clear token on unauthorized
          localStorage.removeItem('accessToken');
        }
        return Promise.reject(new Error(error.response?.data?.message || error.message || 'Response error'));
      }
    );
  }

  // Generic request methods
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url);
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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