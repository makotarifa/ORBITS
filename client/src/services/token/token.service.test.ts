import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenService } from './token.service';

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

describe('TokenService', () => {
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