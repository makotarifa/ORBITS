/**
 * Comprehensive WebSocket connection error types and classifications
 * for task OR-39: Implement connection error handling
 */

export enum SocketErrorType {
  // Network-related errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  DNS_ERROR = 'DNS_ERROR',
  
  // Server-related errors
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  SERVER_MAINTENANCE = 'SERVER_MAINTENANCE',
  SERVER_OVERLOADED = 'SERVER_OVERLOADED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // Authentication-related errors
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Connection-related errors
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  HANDSHAKE_FAILED = 'HANDSHAKE_FAILED',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  TRANSPORT_ERROR = 'TRANSPORT_ERROR',
  
  // Rate limiting and throttling
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_CONNECTIONS = 'TOO_MANY_CONNECTIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Configuration and client errors
  INVALID_URL = 'INVALID_URL',
  INVALID_NAMESPACE = 'INVALID_NAMESPACE',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  CLIENT_ERROR = 'CLIENT_ERROR',
  
  // Generic fallback
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  GENERIC_ERROR = 'GENERIC_ERROR'
}

export enum SocketErrorSeverity {
  LOW = 'LOW',           // Minor issues, auto-retry possible
  MEDIUM = 'MEDIUM',     // Noticeable issues, user action may be needed  
  HIGH = 'HIGH',         // Major issues, immediate user attention required
  CRITICAL = 'CRITICAL'  // Service unavailable, no connection possible
}

export enum SocketErrorCategory {
  TRANSIENT = 'TRANSIENT',     // Temporary errors that may resolve automatically
  PERSISTENT = 'PERSISTENT',   // Errors requiring user action or config changes
  FATAL = 'FATAL'             // Unrecoverable errors
}

export interface SocketErrorDetails {
  type: SocketErrorType;
  severity: SocketErrorSeverity;
  category: SocketErrorCategory;
  message: string;
  technicalMessage?: string;
  userMessage: string;
  recoveryActions: string[];
  canRetry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface SocketConnectionError {
  code?: string | number;
  message: string;
  type?: string;
  description?: string;
  context?: any;
  originalError?: Error;
}

export interface ErrorRecoveryStrategy {
  immediate: string[];      // Actions user can take immediately
  shortTerm: string[];      // Actions for temporary issues
  longTerm: string[];       // Actions for persistent issues
  fallback: string[];       // Last resort options
}

export interface SocketErrorMetrics {
  errorCount: number;
  lastErrorTime: number;
  consecutiveErrors: number;
  errorRate: number;        // Errors per minute
  errorTypes: Map<SocketErrorType, number>;
}

// Error classification utilities
export class SocketErrorClassifier {
  private static readonly ERROR_MAPPINGS = new Map<string | RegExp, SocketErrorDetails>([
    // Network errors
    ['ENOTFOUND', {
      type: SocketErrorType.DNS_ERROR,
      severity: SocketErrorSeverity.HIGH,
      category: SocketErrorCategory.PERSISTENT,
      message: 'DNS resolution failed',
      userMessage: 'Cannot reach game server. Please check your internet connection.',
      recoveryActions: ['Check internet connection', 'Try again in a few moments', 'Contact support if issue persists'],
      canRetry: true,
      retryDelay: 5000,
      maxRetries: 3,
      timestamp: 0
    }],
    ['ECONNREFUSED', {
      type: SocketErrorType.CONNECTION_REFUSED,
      severity: SocketErrorSeverity.HIGH,
      category: SocketErrorCategory.TRANSIENT,
      message: 'Connection refused by server',
      userMessage: 'Game server is currently unavailable. Please try again later.',
      recoveryActions: ['Wait a few moments and try again', 'Check server status', 'Contact support'],
      canRetry: true,
      retryDelay: 10000,
      maxRetries: 5,
      timestamp: 0
    }],
    ['ETIMEDOUT', {
      type: SocketErrorType.NETWORK_TIMEOUT,
      severity: SocketErrorSeverity.MEDIUM,
      category: SocketErrorCategory.TRANSIENT,
      message: 'Network timeout',
      userMessage: 'Connection timed out. Your network might be slow.',
      recoveryActions: ['Check internet speed', 'Retry connection', 'Move closer to router'],
      canRetry: true,
      retryDelay: 3000,
      maxRetries: 3,
      timestamp: 0
    }],
    
    // Server errors
    [/server.*maintenance/i, {
      type: SocketErrorType.SERVER_MAINTENANCE,
      severity: SocketErrorSeverity.CRITICAL,
      category: SocketErrorCategory.PERSISTENT,
      message: 'Server under maintenance',
      userMessage: 'Game server is currently under maintenance. Please try again later.',
      recoveryActions: ['Wait for maintenance to complete', 'Check official announcements', 'Try again in 30 minutes'],
      canRetry: true,
      retryDelay: 300000, // 5 minutes
      maxRetries: 1,
      timestamp: 0
    }],
    [/server.*overload/i, {
      type: SocketErrorType.SERVER_OVERLOADED,
      severity: SocketErrorSeverity.HIGH,
      category: SocketErrorCategory.TRANSIENT,
      message: 'Server overloaded',
      userMessage: 'Game server is currently overloaded. Please wait and try again.',
      recoveryActions: ['Wait a few minutes', 'Try connecting during off-peak hours', 'Retry connection'],
      canRetry: true,
      retryDelay: 60000, // 1 minute
      maxRetries: 3,
      timestamp: 0
    }],
    
    // Authentication errors
    [/unauthorized|auth.*fail/i, {
      type: SocketErrorType.AUTH_FAILED,
      severity: SocketErrorSeverity.HIGH,
      category: SocketErrorCategory.PERSISTENT,
      message: 'Authentication failed',
      userMessage: 'Failed to authenticate with game server. Please log in again.',
      recoveryActions: ['Log out and log in again', 'Clear browser cache', 'Contact support'],
      canRetry: false,
      timestamp: 0
    }],
    [/token.*expir/i, {
      type: SocketErrorType.TOKEN_EXPIRED,
      severity: SocketErrorSeverity.MEDIUM,
      category: SocketErrorCategory.PERSISTENT,
      message: 'Authentication token expired',
      userMessage: 'Your session has expired. Please log in again.',
      recoveryActions: ['Log in again', 'Refresh the page', 'Clear browser data'],
      canRetry: false,
      timestamp: 0
    }],
    
    // Rate limiting
    [/rate.*limit|too.*many.*request/i, {
      type: SocketErrorType.RATE_LIMIT_EXCEEDED,
      severity: SocketErrorSeverity.MEDIUM,
      category: SocketErrorCategory.TRANSIENT,
      message: 'Rate limit exceeded',
      userMessage: 'Too many connection attempts. Please wait before trying again.',
      recoveryActions: ['Wait 1 minute before reconnecting', 'Reduce connection frequency', 'Try again later'],
      canRetry: true,
      retryDelay: 60000,
      maxRetries: 2,
      timestamp: 0
    }]
  ]);

  public static classifyError(error: SocketConnectionError | Error | string): SocketErrorDetails {
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const errorCode = typeof error === 'object' && 'code' in error ? error.code : undefined;

    // Check for specific error codes and patterns
    for (const [pattern, details] of this.ERROR_MAPPINGS) {
      if (typeof pattern === 'string') {
        if (errorCode === pattern || errorMessage.includes(pattern)) {
          return { ...details, timestamp: Date.now() };
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(errorMessage)) {
          return { ...details, timestamp: Date.now() };
        }
      }
    }

    // Default classification for unknown errors
    return {
      type: SocketErrorType.UNKNOWN_ERROR,
      severity: SocketErrorSeverity.MEDIUM,
      category: SocketErrorCategory.TRANSIENT,
      message: errorMessage || 'Unknown connection error',
      userMessage: 'An unexpected connection error occurred. Please try again.',
      recoveryActions: ['Retry connection', 'Refresh the page', 'Check internet connection'],
      canRetry: true,
      retryDelay: 5000,
      maxRetries: 3,
      timestamp: Date.now()
    };
  }

  public static getRecoveryStrategy(errorDetails: SocketErrorDetails): ErrorRecoveryStrategy {
    const { category, canRetry, type } = errorDetails;

    const strategy: ErrorRecoveryStrategy = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      fallback: []
    };

    if (canRetry && category === SocketErrorCategory.TRANSIENT) {
      strategy.immediate = ['Retry connection', 'Wait a few seconds'];
      strategy.shortTerm = ['Check internet connection', 'Try again in a few minutes'];
    }

    if (type === SocketErrorType.AUTH_FAILED || type === SocketErrorType.TOKEN_EXPIRED) {
      strategy.immediate = ['Log out and log in again'];
      strategy.shortTerm = ['Clear browser cache', 'Refresh page'];
    }

    if (category === SocketErrorCategory.PERSISTENT) {
      strategy.longTerm = ['Check server status', 'Contact support', 'Try again later'];
    }

    strategy.fallback = ['Refresh the entire application', 'Contact technical support', 'Use alternative connection method'];

    return strategy;
  }
}