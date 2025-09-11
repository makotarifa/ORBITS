import { apiService } from '../api/api.service';
import {
  RegisterApiRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ApiResponse
} from '../../types/auth';

class AuthService {
  private readonly baseUrl = '/auth';

  async register(data: RegisterApiRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiService.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>(`${this.baseUrl}/login`, data);

    // Store token if login successful
    if (response.success && response.data?.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }

    return response;
  }

  logout(): void {
    localStorage.removeItem('accessToken');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();