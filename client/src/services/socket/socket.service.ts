import { io, Socket } from 'socket.io-client';
import { GAME_CONSTANTS } from '../../constants/game.constants';
import {
  PlayerMoveDto,
  PlayerPositionDto,
  ConnectedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerMovedEvent,
  PositionUpdateEvent,
  RoomJoinedEvent,
  RoomLeftEvent,
  ErrorEvent,
  ServerInfoEvent,
  ClientsCountEvent,
  PongEvent,
  JoinRoomEvent,
  LeaveRoomEvent
} from '../../types/game-events.types';
import {
  SocketErrorDetails,
  SocketErrorClassifier,
  SocketConnectionError,
  SocketErrorMetrics
} from '../../types/socket-errors.types';
import { authService } from '../auth/auth.service';
import { tokenService } from '../token/token.service';
import { errorLogger } from './error-logger.service';
import { JwtUtils } from '../../utils';

export interface SocketEvents {
  // Server to Client
  'connected': (data: ConnectedEvent) => void;
  'player-joined': (data: PlayerJoinedEvent) => void;
  'player-left': (data: PlayerLeftEvent) => void;
  'player-moved': (data: PlayerMovedEvent) => void;
  'position-update': (data: PositionUpdateEvent) => void;
  'room-joined': (data: RoomJoinedEvent) => void;
  'room-left': (data: RoomLeftEvent) => void;
  'error': (data: ErrorEvent) => void;
  'server-info': (data: ServerInfoEvent) => void;
  'clients-count': (data: ClientsCountEvent) => void;
  'pong': (data: PongEvent) => void;

  // Client to Server
  'join-room': (data: JoinRoomEvent) => void;
  'leave-room': (data: LeaveRoomEvent) => void;
  'player-move': (data: PlayerMoveDto) => void;
  'player-position': (data: PlayerPositionDto) => void;
  'ping': () => void;
  'get-server-info': () => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = GAME_CONSTANTS.SOCKET.MAX_RECONNECT_ATTEMPTS;
  private readonly reconnectDelay = GAME_CONSTANTS.SOCKET.RECONNECT_DELAY;
  
  // Enhanced error handling properties
  private currentError: SocketErrorDetails | null = null;
  private errorMetrics: SocketErrorMetrics;
  private errorCallbacks = new Set<(error: SocketErrorDetails) => void>();
  private recoveryCallbacks = new Set<(success: boolean) => void>();
  private debugMode = import.meta.env.DEV || false;

  constructor() {
    this.errorMetrics = {
      errorCount: 0,
      lastErrorTime: 0,
      consecutiveErrors: 0,
      errorRate: 0,
      errorTypes: new Map(),
      errorTimestamps: []
    };
    this.initializeSocket();
  }

  // Enhanced error handling methods
  private handleError(error: SocketConnectionError | Error | string, context?: Record<string, any>): SocketErrorDetails {
    const errorDetails = SocketErrorClassifier.classifyError(error);
    errorDetails.context = { ...errorDetails.context, ...context };
    
    this.currentError = errorDetails;
    this.updateErrorMetrics(errorDetails);
    
    // Enhanced logging with error logger service
    errorLogger.logError(errorDetails, context);
    
    // Log network information for debugging
    if (this.debugMode) {
      errorLogger.logNetworkInfo();
    }
    
    // Send error report for critical errors
    if (errorDetails.severity === 'CRITICAL' || errorDetails.severity === 'HIGH') {
      errorLogger.sendErrorReport(errorDetails, this.errorMetrics).catch(err => {
        console.warn('Failed to send error report:', err);
      });
    }
    
    // Log error with appropriate level (legacy console logging)
    this.logError(errorDetails);
    
    // Notify error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorDetails);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
        errorLogger.log('error', 'callback', 'Error in error callback', { 
          callbackError: String(callbackError) 
        });
      }
    });
    
    return errorDetails;
  }

  private updateErrorMetrics(errorDetails: SocketErrorDetails): void {
    this.errorMetrics.errorCount++;
    this.errorMetrics.lastErrorTime = errorDetails.timestamp;
    this.errorMetrics.consecutiveErrors++;
    
    // Update error type count
    const currentCount = this.errorMetrics.errorTypes.get(errorDetails.type) || 0;
    this.errorMetrics.errorTypes.set(errorDetails.type, currentCount + 1);
    
    // Track error timestamps for rate calculation
    this.errorMetrics.errorTimestamps.push(errorDetails.timestamp);
    
    // Remove timestamps older than 1 minute
    const timeWindow = 60000; // 1 minute
    const cutoffTime = Date.now() - timeWindow;
    this.errorMetrics.errorTimestamps = this.errorMetrics.errorTimestamps.filter(
      timestamp => timestamp > cutoffTime
    );
    
    // Calculate error rate (errors per minute)
    this.errorMetrics.errorRate = this.errorMetrics.errorTimestamps.length;
  }

  private logError(errorDetails: SocketErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails);
    const logMessage = `[SocketService] ${errorDetails.type}: ${errorDetails.message}`;
    
    const logData = {
      type: errorDetails.type,
      severity: errorDetails.severity,
      category: errorDetails.category,
      message: errorDetails.message,
      userMessage: errorDetails.userMessage,
      canRetry: errorDetails.canRetry,
      context: errorDetails.context,
      timestamp: new Date(errorDetails.timestamp).toISOString(),
      metrics: this.debugMode ? this.errorMetrics : undefined
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  private getLogLevel(errorDetails: SocketErrorDetails): 'error' | 'warn' | 'info' | 'log' {
    switch (errorDetails.severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'info';
      default:
        return 'log';
    }
  }

  private clearError(): void {
    this.currentError = null;
    this.errorMetrics.consecutiveErrors = 0;
  }

  private shouldAttemptRecovery(errorDetails: SocketErrorDetails): boolean {
    if (!errorDetails.canRetry) return false;
    if (this.reconnectAttempts >= (errorDetails.maxRetries || this.maxReconnectAttempts)) return false;
    if (errorDetails.category === 'FATAL') return false;
    return true;
  }

  // JWT token handling methods
  private handleTokenExpired(): void {
    this.handleError({
      message: 'JWT token has expired',
      code: 'TOKEN_EXPIRED',
      type: 'authentication'
    }, {
      phase: 'authentication',
      tokenExpired: true
    });

    // Attempt to refresh token automatically
    this.attemptTokenRefresh();
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const newToken = await authService.refreshToken();
      if (newToken) {
        // Token refreshed successfully, reinitialize socket with new token
        this.clearError();
        this.reconnectAttempts = 0;
        
        // Update socket auth if already connected
        if (this.socket && this.socket.connected) {
          this.socket.auth = { token: newToken };
          // Emit a token update event if the server supports it
          this.socket.emit('update-token', { token: newToken });
        } else {
          // Reinitialize socket with new token
          this.destroy();
          this.initializeSocket();
        }
        
        return true;
      } else {
        // Token refresh failed, handle as authentication failure
        this.handleError({
          message: 'Token refresh failed - please log in again',
          code: 'TOKEN_REFRESH_FAILED',
          type: 'authentication'
        }, {
          phase: 'authentication',
          tokenRefreshFailed: true
        });
        return false;
      }
    } catch (error) {
      this.handleError(error as Error, {
        phase: 'authentication',
        tokenRefreshError: true
      });
      return false;
    }
  }

  private setupTokenValidation(): void {
    if (!this.socket) return;

    // Listen for token validation errors from server
    this.socket.on('token-invalid', () => {
      this.handleError({
        message: 'Server rejected authentication token',
        code: 'TOKEN_INVALID',
        type: 'authentication'
      }, {
        phase: 'authentication',
        serverRejected: true
      });
      
      // Attempt token refresh
      this.attemptTokenRefresh();
    });

    this.socket.on('token-expired', () => {
      this.handleTokenExpired();
    });

    // Set up periodic token validation
    this.setupTokenExpiryCheck();
  }

  private setupTokenExpiryCheck(): void {
    // Check token expiry every 30 seconds
    const tokenCheckInterval = setInterval(() => {
      const token = tokenService.getToken();
      
      if (!token) {
        // No token available
        if (this.socket?.connected) {
          this.handleError({
            message: 'Authentication token not found',
            code: 'TOKEN_NOT_FOUND',
            type: 'authentication'
          }, {
            phase: 'runtime',
            tokenMissing: true
          });
        }
        return;
      }

      if (tokenService.isTokenExpired(token)) {
        this.handleTokenExpired();
        return;
      }

      // Check if token will expire in the next 5 minutes
      if (JwtUtils.isJwtExpiringSoon(token, 5)) {
        // Token will expire soon, attempt preemptive refresh
        console.log('Token expiring soon, attempting preemptive refresh');
        this.attemptTokenRefresh();
      }
    }, 30000);

    // Store interval reference for cleanup
    if (!this.socket) return;
    (this.socket as any)._tokenCheckInterval = tokenCheckInterval;
  }

  private initializeSocket(): void {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || GAME_CONSTANTS.DEFAULTS.SERVER_URL;
      const token = tokenService.getToken();

      // Check if token is expired before initializing connection
      if (token && tokenService.isTokenExpired(token)) {
        this.handleTokenExpired();
        return;
      }

      const socketOptions: any = {
        transports: [...GAME_CONSTANTS.SOCKET.TRANSPORTS],
        timeout: GAME_CONSTANTS.SOCKET.TIMEOUT,
        forceNew: GAME_CONSTANTS.SOCKET.FORCE_NEW,
        reconnection: GAME_CONSTANTS.SOCKET.RECONNECTION,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      };

      // Add JWT authentication if available
      if (token) {
        socketOptions.auth = {
          token: token
        };
        // Removed insecure query parameter transmission of JWT token
      }

      this.socket = io(`${serverUrl}${GAME_CONSTANTS.NAMESPACE}`, socketOptions);

      this.setupEventListeners();
      this.setupReconnectionLogic();
      this.setupTokenValidation();

    } catch (error) {
      this.handleError(error as Error, {
        phase: 'initialization',
        hasToken: !!tokenService.getToken()
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(GAME_CONSTANTS.EVENTS.CONNECT, () => {
      console.log(GAME_CONSTANTS.MESSAGES.CONNECTED_TO_GAME_SERVER, this.socket?.id);
      errorLogger.logConnection('connect', { socketId: this.socket?.id });
      
      this.reconnectAttempts = 0;
      this.clearError(); // Clear any previous errors on successful connection
      
      // Notify recovery callbacks of successful connection
      this.recoveryCallbacks.forEach(callback => {
        try {
          callback(true);
        } catch (callbackError) {
          console.error('Error in recovery callback:', callbackError);
          errorLogger.log('error', 'callback', 'Error in recovery callback', {
            callbackError: String(callbackError)
          });
        }
      });
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.DISCONNECT, (reason: string) => {
      console.log(GAME_CONSTANTS.MESSAGES.DISCONNECTED_FROM_GAME_SERVER, reason);
      errorLogger.logConnection('disconnect', { reason, socketId: this.socket?.id });
      
      // Classify disconnect reason and handle appropriately
      const disconnectContext = { disconnectReason: reason, socketId: this.socket?.id };
      
      // Only treat unexpected disconnects as errors
      if (reason !== 'io client disconnect' && reason !== 'client namespace disconnect') {
        this.handleError({
          message: `Unexpected disconnect: ${reason}`,
          code: reason,
          type: 'disconnect'
        }, disconnectContext);
      }
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.CONNECT_ERROR, (error: Error) => {
      const errorDetails = this.handleError(error, { 
        phase: 'connection',
        attempt: this.reconnectAttempts + 1,
        socketId: this.socket?.id
      });
      
      if (this.shouldAttemptRecovery(errorDetails)) {
        this.handleReconnectionWithBackoff(errorDetails);
      } else {
        // Notify recovery callbacks of failed connection
        this.recoveryCallbacks.forEach(callback => {
          try {
            callback(false);
          } catch (callbackError) {
            console.error('Error in recovery callback:', callbackError);
          }
        });
      }
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT, (attemptNumber: number) => {
      console.log(GAME_CONSTANTS.MESSAGES.RECONNECTED_TO_GAME_SERVER, attemptNumber, GAME_CONSTANTS.MESSAGES.ATTEMPTS);
      errorLogger.logConnection('reconnect', { 
        attemptNumber, 
        socketId: this.socket?.id,
        totalAttempts: this.reconnectAttempts
      });
      this.clearError(); // Clear errors on successful reconnection
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT_ERROR, (error: Error) => {
      this.handleError(error, {
        phase: 'reconnection',
        attempt: this.reconnectAttempts,
        socketId: this.socket?.id
      });
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT_FAILED, () => {
      this.handleError({
        message: 'All reconnection attempts failed',
        code: 'RECONNECT_FAILED',
        type: 'reconnection_failed'
      }, {
        phase: 'reconnection',
        totalAttempts: this.maxReconnectAttempts,
        socketId: this.socket?.id
      });
      
      // Notify recovery callbacks of final failure
      this.recoveryCallbacks.forEach(callback => {
        try {
          callback(false);
        } catch (callbackError) {
          console.error('Error in recovery callback:', callbackError);
        }
      });
    });

    // Listen for server-side error events
    this.socket.on(GAME_CONSTANTS.EVENTS.ERROR, (errorData: ErrorEvent) => {
      this.handleError({
        message: errorData.message,
        code: 'SERVER_ERROR',
        context: errorData.error
      }, {
        phase: 'runtime',
        socketId: this.socket?.id
      });
    });
  }

  private setupReconnectionLogic(): void {
    if (!this.socket) return;

    this.socket.on(GAME_CONSTANTS.EVENTS.DISCONNECT, () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`${GAME_CONSTANTS.MESSAGES.ATTEMPTING_TO_RECONNECT} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }

  private handleReconnectionWithBackoff(errorDetails: SocketErrorDetails): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError({
        message: 'Maximum reconnection attempts reached',
        code: 'MAX_RECONNECT_ATTEMPTS',
        type: 'reconnection_exhausted'
      }, {
        phase: 'reconnection',
        totalAttempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    
    // Use error-specific delay or default exponential backoff
    const baseDelay = errorDetails.retryDelay || this.reconnectDelay;
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts - 1), // Exponential backoff
      30000 // Cap at 30 seconds
    );

    console.log(
      `${GAME_CONSTANTS.MESSAGES.RECONNECTING} (${this.reconnectAttempts}/${this.maxReconnectAttempts}) - Delay: ${delay}ms`
    );

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        try {
          this.socket.connect();
        } catch (connectError) {
          this.handleError(connectError as Error, {
            phase: 'reconnection',
            attempt: this.reconnectAttempts
          });
        }
      }
    }, delay);
  }

  // Connection management
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        const errorDetails = this.handleError({
          message: GAME_CONSTANTS.MESSAGES.SOCKET_NOT_INITIALIZED,
          code: 'SOCKET_NOT_INITIALIZED',
          type: 'initialization'
        });
        reject(new Error(errorDetails.userMessage));
        return;
      }

      if (this.socket.connected) {
        this.clearError(); // Clear any previous errors
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        const errorDetails = this.handleError({
          message: GAME_CONSTANTS.MESSAGES.CONNECTION_TIMEOUT,
          code: 'CONNECTION_TIMEOUT',
          type: 'timeout'
        }, {
          phase: 'connection',
          timeout: GAME_CONSTANTS.SOCKET.CONNECTION_TIMEOUT
        });
        reject(new Error(errorDetails.userMessage));
      }, GAME_CONSTANTS.SOCKET.CONNECTION_TIMEOUT);

      this.socket.once(GAME_CONSTANTS.EVENTS.CONNECT, () => {
        clearTimeout(timeout);
        this.clearError(); // Clear errors on successful connection
        resolve();
      });

      this.socket.once(GAME_CONSTANTS.EVENTS.CONNECT_ERROR, (error: Error) => {
        clearTimeout(timeout);
        const errorDetails = this.handleError(error, {
          phase: 'connection',
          method: 'connect'
        });
        reject(new Error(errorDetails.userMessage));
      });

      try {
        this.socket.connect();
      } catch (error) {
        clearTimeout(timeout);
        const errorDetails = this.handleError(error as Error, {
          phase: 'connection',
          method: 'connect'
        });
        reject(new Error(errorDetails.userMessage));
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Event emission methods
  public joinRoom(roomId: string): void {
    this.emit('join-room', { roomId });
  }

  public leaveRoom(roomId: string): void {
    this.emit('leave-room', { roomId });
  }

  public sendPlayerMove(data: PlayerMoveDto): void {
    this.emit('player-move', data);
  }

  public sendPlayerPosition(data: PlayerPositionDto): void {
    this.emit('player-position', data);
  }

  public ping(): void {
    this.emit('ping');
  }

  public getServerInfo(): void {
    this.emit('get-server-info');
  }

  // Event listening methods for game events
  public on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    this.socket?.on(event as string, callback as any);
  }

  public off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (callback) {
      this.socket?.off(event as string, callback as any);
    } else {
      this.socket?.off(event as string);
    }
  }

  public once<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    this.socket?.once(event as string, callback as any);
  }

  // Event listening methods for native Socket.io events
  public onNative(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  public offNative(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  public onceNative(event: string, callback: (...args: any[]) => void): void {
    this.socket?.once(event, callback);
  }

  // Generic emit method
  private emit<T extends keyof SocketEvents>(event: T, data?: Parameters<SocketEvents[T]>[0]): void {
    if (!this.socket?.connected) {
      console.warn(GAME_CONSTANTS.MESSAGES.SOCKET_NOT_CONNECTED, event);
      return;
    }

    this.socket.emit(event as string, data);
  }

  // Enhanced error handling public methods
  public getCurrentError(): SocketErrorDetails | null {
    return this.currentError;
  }

  public getErrorMetrics(): SocketErrorMetrics {
    return { ...this.errorMetrics };
  }

  public onError(callback: (error: SocketErrorDetails) => void): void {
    this.errorCallbacks.add(callback);
  }

  public offError(callback: (error: SocketErrorDetails) => void): void {
    this.errorCallbacks.delete(callback);
  }

  public onRecovery(callback: (success: boolean) => void): void {
    this.recoveryCallbacks.add(callback);
  }

  public offRecovery(callback: (success: boolean) => void): void {
    this.recoveryCallbacks.delete(callback);
  }

  public clearCurrentError(): void {
    this.clearError();
  }

  public forceReconnect(): Promise<void> {
    this.disconnect();
    // Reset reconnect attempts for forced reconnect
    this.reconnectAttempts = 0;
    this.clearError();
    
    // Wait a moment before reconnecting
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await this.connect();
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, 1000);
    });
  }

  public getConnectionHealth(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.isConnected()) {
      issues.push('Not connected to server');
      recommendations.push('Try reconnecting');
    }

    if (this.currentError) {
      issues.push(`Current error: ${this.currentError.type}`);
      recommendations.push(...this.currentError.recoveryActions);
    }

    if (this.errorMetrics.consecutiveErrors >= 3) {
      issues.push('Multiple consecutive errors detected');
      recommendations.push('Check network stability');
    }

    if (this.errorMetrics.errorRate > 5) { // More than 5 errors per minute
      issues.push('High error rate detected');
      recommendations.push('Check server status and network connection');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Debug and logging methods
  public enableDebugMode(enable: boolean = true): void {
    this.debugMode = enable;
    errorLogger.enableDebugMode(enable);
  }

  public getDebugInfo(): {
    isDebugMode: boolean;
    connectionState: {
      connected: boolean;
      connecting: boolean;
      socketId?: string;
      reconnectAttempts: number;
    };
    errorState: {
      currentError: SocketErrorDetails | null;
      metrics: SocketErrorMetrics;
    };
    logs: any[];
  } {
    return {
      isDebugMode: this.debugMode,
      connectionState: {
        connected: this.isConnected(),
        connecting: false, // We don't track this at service level
        socketId: this.getSocketId(),
        reconnectAttempts: this.reconnectAttempts
      },
      errorState: {
        currentError: this.currentError,
        metrics: this.getErrorMetrics()
      },
      logs: errorLogger.getLogs({ limit: 50 })
    };
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    return errorLogger.exportLogs(format);
  }

  public clearLogs(): void {
    errorLogger.clearLogs();
  }

  // Cleanup
  public removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  public destroy(): void {
    // Clean up token validation interval
    if (this.socket && (this.socket as any)._tokenCheckInterval) {
      clearInterval((this.socket as any)._tokenCheckInterval);
      (this.socket as any)._tokenCheckInterval = null;
    }
    
    this.removeAllListeners();
    this.disconnect();
    this.errorCallbacks.clear();
    this.recoveryCallbacks.clear();
  }
}

// Singleton instance
export const socketService = new SocketService();