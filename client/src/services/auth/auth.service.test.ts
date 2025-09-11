import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the API service before importing the auth service
vi.mock('../api/api.service', () => ({
  apiService: {
    post: vi.fn(),
  },
}));

// Mock tokenService
vi.mock('../token/token.service', () => ({
  tokenService: {
    setTokens: vi.fn(),
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    isTokenExpired: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

import { authService } from './auth.service';
import { apiService } from '../api/api.service';
import { tokenService } from '../token/token.service';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('should set tokens correctly', () => {
      tokenService.setTokens('access-token', 'refresh-token');

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });

    it('should set tokens without refresh token', () => {
      tokenService.setTokens('access-token');

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith('refreshToken', expect.any(String));
    });

    it('should get token correctly', () => {
      mockSessionStorage.getItem.mockReturnValue('access-token');

      const token = tokenService.getToken();

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(token).toBe('access-token');
    });

    it('should get refresh token correctly', () => {
      mockSessionStorage.getItem.mockReturnValue('refresh-token');

      const token = tokenService.getRefreshToken();

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('refreshToken');
      expect(token).toBe('refresh-token');
    });

    it('should clear tokens correctly', () => {
      tokenService.clearTokens();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should check if token is expired - valid token', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      const validToken = `header.${btoa(JSON.stringify({ exp: Math.floor(futureDate.getTime() / 1000) }))}.signature`;

      const isExpired = tokenService.isTokenExpired(validToken);

      expect(isExpired).toBe(false);
    });

    it('should check if token is expired - expired token', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const expiredToken = `header.${btoa(JSON.stringify({ exp: Math.floor(pastDate.getTime() / 1000) }))}.signature`;

      const isExpired = tokenService.isTokenExpired(expiredToken);

      expect(isExpired).toBe(true);
    });

    it('should check if token is expired - invalid token', () => {
      const isExpired = tokenService.isTokenExpired('invalid-token');

      expect(isExpired).toBe(true);
    });
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

  describe('User Info', () => {
    it('should get current user from valid token', () => {
      const userData = { sub: '1', username: 'testuser' };
      const token = `header.${btoa(JSON.stringify(userData))}.signature`;

      mockSessionStorage.getItem.mockReturnValue(token);

      const user = tokenService.getCurrentUser();

      expect(user).toEqual({ id: '1', username: 'testuser' });
    });

    it('should return null for invalid token', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-token');

      const user = tokenService.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null when no token', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const user = tokenService.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should check authentication status', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      const validToken = `header.${btoa(JSON.stringify({ exp: Math.floor(futureDate.getTime() / 1000) }))}.signature`;

      mockSessionStorage.getItem.mockReturnValue(validToken);

      const isAuthenticated = tokenService.isAuthenticated();

      expect(isAuthenticated).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const expiredToken = `header.${btoa(JSON.stringify({ exp: Math.floor(pastDate.getTime() / 1000) }))}.signature`;

      mockSessionStorage.getItem.mockReturnValue(expiredToken);

      const isAuthenticated = tokenService.isAuthenticated();

      expect(isAuthenticated).toBe(false);
    });
  });
});