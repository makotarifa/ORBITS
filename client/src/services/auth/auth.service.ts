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
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private refreshPromise: Promise<any> | null = null;

  // Storage methods with better security
  private getStorage(): Storage {
    // Use sessionStorage for better security (cleared when tab closes)
    return sessionStorage;
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    const storage = this.getStorage();
    storage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  getToken(): string | null {
    return this.getStorage().getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getStorage().getItem(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    const storage = this.getStorage();
    storage.removeItem(this.TOKEN_KEY);
    storage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Check if token is expired (basic check)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true; // If we can't parse, assume expired
    }
  }

  // Refresh token logic
  async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshPromise = apiService.post<{ access_token: string }>('/auth/refresh', {
      refreshToken
    }).then(response => {
      if (response.success && response.data?.access_token) {
        this.setTokens(response.data.access_token);
        return response.data.access_token;
      }
      this.clearTokens();
      return null;
    }).catch(() => {
      this.clearTokens();
      return null;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async register(data: RegisterApiRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiService.post<RegisterResponse>(`${this.baseUrl}/register`, data);

    // Store tokens if registration successful
    if (response.success && response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>(`${this.baseUrl}/login`, data);

    // Store tokens if login successful
    if (response.success && response.data?.access_token) {
      this.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response;
  }

  logout(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Get current user info from token
  getCurrentUser(): { id: string; username: string } | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        username: payload.username
      };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();