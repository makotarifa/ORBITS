/**
 * JWT utility functions for parsing and validating JWT tokens
 */

export interface JwtPayload {
  sub?: string;
  userId?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export class JwtUtils {
  /**
   * Parse JWT token payload
   * @param token JWT token string
   * @returns Parsed payload or null if invalid
   */
  static parseJwtPayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token structure');
      }

      // JWT uses base64url encoding, not standard base64
      const payloadJson = this.base64UrlDecode(parts[1]);
      const payload: JwtPayload = JSON.parse(payloadJson);

      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid JWT payload');
      }

      return payload;
    } catch (error) {
      console.warn('Failed to parse JWT token:', error);
      return null;
    }
  }

  /**
   * Decode base64url string to regular string
   * @param base64Url base64url encoded string
   * @returns Decoded string
   */
  private static base64UrlDecode(base64Url: string): string {
    // Convert base64url to base64 by replacing chars and adding padding
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return atob(base64);
  }

  /**
   * Get JWT expiry time in milliseconds
   * @param token JWT token string
   * @returns Expiry time or null if invalid/expired
   */
  static getJwtExpiryTime(token: string): number | null {
    const payload = this.parseJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      return null;
    }
    return payload.exp * 1000; // Convert to milliseconds
  }

  /**
   * Get user ID from JWT token
   * @param token JWT token string
   * @returns User ID or undefined if not found
   */
  static getJwtUserId(token: string): string | undefined {
    const payload = this.parseJwtPayload(token);
    return payload?.sub || payload?.userId;
  }

  /**
   * Check if JWT token is valid (not expired)
   * @param token JWT token string
   * @returns True if valid, false otherwise
   */
  static isJwtValid(token: string): boolean {
    const expiryTime = this.getJwtExpiryTime(token);
    if (!expiryTime) {
      return false;
    }
    return expiryTime > Date.now();
  }

  /**
   * Check if JWT token will expire within specified minutes
   * @param token JWT token string
   * @param minutes Minutes threshold
   * @returns True if expiring soon, false otherwise
   */
  static isJwtExpiringSoon(token: string, minutes: number = 5): boolean {
    const expiryTime = this.getJwtExpiryTime(token);
    if (!expiryTime) {
      return false;
    }

    const timeUntilExpiry = expiryTime - Date.now();
    const threshold = minutes * 60 * 1000; // Convert minutes to milliseconds

    return timeUntilExpiry <= threshold && timeUntilExpiry > 0;
  }

  /**
   * Get time until JWT expiry in milliseconds
   * @param token JWT token string
   * @returns Time until expiry or null if invalid
   */
  static getTimeUntilExpiry(token: string): number | null {
    const expiryTime = this.getJwtExpiryTime(token);
    if (!expiryTime) {
      return null;
    }
    return expiryTime - Date.now();
  }
}