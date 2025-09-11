import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the API service before importing the auth service
vi.mock('../api/api.service', () => ({
  apiService: {
    post: vi.fn(),
  },
}));

// Mock tokenService - these are the methods that authService calls
vi.mock('../token/token.service', () => ({
  tokenService: {
    setTokens: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { authService } from './auth.service';
import { apiService } from '../api/api.service';
import { tokenService } from '../token/token.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: { id: '1', username: 'testuser' },
        },
      };

      (apiService.post as any).mockResolvedValue(mockResponse);

      const result = await authService.login({
        emailOrUsername: 'test@example.com',
        password: 'password',
      });

      expect(apiService.post).toHaveBeenCalledWith('/auth/login', {
        emailOrUsername: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
      expect(tokenService.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should register successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: { id: '1', username: 'testuser' },
        },
      };

      (apiService.post as any).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      });

      expect(apiService.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
      expect(tokenService.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      (apiService.post as any).mockResolvedValue(mockResponse);

      const result = await authService.login({
        emailOrUsername: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result).toEqual(mockResponse);
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });

    it('should handle register failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Email already exists',
      };

      (apiService.post as any).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'existing@example.com',
        username: 'testuser',
        password: 'password',
      });

      expect(result).toEqual(mockResponse);
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    // Mock fetch globally
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should refresh token successfully', async () => {
      (tokenService.getRefreshToken as any).mockReturnValue('refresh-token');

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { access_token: 'new-access-token' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      });
      expect(tokenService.setTokens).toHaveBeenCalledWith('new-access-token');
      expect(result).toBe('new-access-token');
    });

    it('should return null when no refresh token', async () => {
      (tokenService.getRefreshToken as any).mockReturnValue(null);

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null on refresh failure', async () => {
      (tokenService.getRefreshToken as any).mockReturnValue('refresh-token');

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(result).toBeNull();
      expect(tokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should clear tokens on logout', () => {
      authService.logout();

      expect(tokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('Authentication Status', () => {
    it('should check authentication status', () => {
      (tokenService.isAuthenticated as any).mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(tokenService.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should get current user', () => {
      const mockUser = { id: '1', username: 'testuser' };
      (tokenService.getCurrentUser as any).mockReturnValue(mockUser);

      const result = authService.getCurrentUser();

      expect(tokenService.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      (tokenService.getCurrentUser as any).mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(tokenService.getCurrentUser).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});