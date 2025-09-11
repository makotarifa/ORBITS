class TokenService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

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

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
}

export const tokenService = new TokenService();