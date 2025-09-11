import { apiService } from '../api/api.service';
import { tokenService } from '../token/token.service';
import {
  RegisterApiRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ApiResponse
} from '../../types/auth';

class AuthService {
  private readonly baseUrl = '/auth';
  private refreshPromise: Promise<string | null> | null = null;

  // Refresh token logic
  async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // Use fetch directly to avoid circular dependency with apiService
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.refreshPromise = fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async response => {
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.access_token) {
            tokenService.setTokens(data.data.access_token);
            return data.data.access_token;
          }
        }
        tokenService.clearTokens();
        return null;
      })
      .catch(() => {
        tokenService.clearTokens();
        return null;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async register(data: RegisterApiRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiService.post<RegisterResponse>(`${this.baseUrl}/register`, data);

    // Store tokens if registration successful
    if (response.success && response.data?.access_token) {
      tokenService.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>(`${this.baseUrl}/login`, data);

    // Store tokens if login successful
    if (response.success && response.data?.access_token) {
      tokenService.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response;
  }

  logout(): void {
    tokenService.clearTokens();
  }

  isAuthenticated(): boolean {
    return tokenService.isAuthenticated();
  }

  // Get current user info from token
  getCurrentUser(): { id: string; username: string } | null {
    return tokenService.getCurrentUser();
  }
}

export const authService = new AuthService();