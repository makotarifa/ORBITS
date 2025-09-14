import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../../services/socket/socket.service';
import { SocketErrorDetails } from '../../types/socket-errors.types';
import { GAME_CONSTANTS } from '../../constants/game.constants';

export interface UseSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  socketId: string | undefined;
  error: string | null;
  errorDetails: SocketErrorDetails | null;
  connectionHealth: {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  forceReconnect: () => Promise<void>;
  clearError: () => void;
  canRetry: boolean;
  retryIn: number; // seconds until next retry attempt
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<SocketErrorDetails | null>(null);
  const [connectionHealth, setConnectionHealth] = useState({
    isHealthy: true,
    issues: [] as string[],
    recommendations: [] as string[]
  });
  const [retryIn, setRetryIn] = useState(0);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update connection health periodically
  const updateConnectionHealth = useCallback(() => {
    const health = socketService.getConnectionHealth();
    setConnectionHealth(health);
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (isConnected) return;

    setIsConnecting(true);
    setError(null);
    setErrorDetails(null);

    try {
      await socketService.connect();
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
      updateConnectionHealth();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      
      // Get detailed error information from socket service
      const currentError = socketService.getCurrentError();
      setErrorDetails(currentError);
      updateConnectionHealth();
      
      console.error('Socket connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, updateConnectionHealth]);

  const disconnect = useCallback((): void => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
    setError(null);
    setErrorDetails(null);
    setRetryIn(0);
    updateConnectionHealth();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [updateConnectionHealth]);

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    await connect();
  }, [connect, disconnect]);

  const forceReconnect = useCallback(async (): Promise<void> => {
    try {
      await socketService.forceReconnect();
      updateConnectionHealth();
    } catch (err) {
      console.error('Force reconnect failed:', err);
    }
  }, [updateConnectionHealth]);

  const clearError = useCallback((): void => {
    socketService.clearCurrentError();
    setError(null);
    setErrorDetails(null);
    setRetryIn(0);
    updateConnectionHealth();
  }, [updateConnectionHealth]);

  // Calculate retry countdown
  const updateRetryCountdown = useCallback((errorDetails: SocketErrorDetails) => {
    if (!errorDetails.canRetry || !errorDetails.retryDelay) return;
    
    const timeSinceError = Date.now() - errorDetails.timestamp;
    const timeUntilRetry = Math.max(0, (errorDetails.retryDelay - timeSinceError) / 1000);
    
    setRetryIn(Math.ceil(timeUntilRetry));
    
    if (timeUntilRetry > 0) {
      retryTimerRef.current = setTimeout(() => updateRetryCountdown(errorDetails), 1000);
    }
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(socketService.getSocketId());
      setError(null);
      setErrorDetails(null);
      setRetryIn(0);
      updateConnectionHealth();
      console.log('Socket connected:', socketService.getSocketId());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(undefined);
      updateConnectionHealth();
      console.log('Socket disconnected');
    };

    const handleConnectError = (err: Error) => {
      setIsConnecting(false);
      setError(err.message || 'Connection error');
      
      // Get detailed error information
      const currentError = socketService.getCurrentError();
      setErrorDetails(currentError);
      
      if (currentError?.canRetry) {
        updateRetryCountdown(currentError);
      }
      
      updateConnectionHealth();
      console.error('Socket connection error:', err);
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(socketService.getSocketId());
      setError(null);
      setErrorDetails(null);
      setRetryIn(0);
      updateConnectionHealth();
      console.log('Socket reconnected:', socketService.getSocketId());
    };

    const handleError = (errorDetails: SocketErrorDetails) => {
      setError(errorDetails.userMessage);
      setErrorDetails(errorDetails);
      
      if (errorDetails.canRetry) {
        updateRetryCountdown(errorDetails);
      }
      
      updateConnectionHealth();
    };

    const handleRecovery = (success: boolean) => {
      if (success) {
        setError(null);
        setErrorDetails(null);
        setRetryIn(0);
      }
      updateConnectionHealth();
    };

    // Set up native socket event listeners
    socketService.onNative('connect', handleConnect);
    socketService.onNative('disconnect', handleDisconnect);
    socketService.onNative('connect_error', handleConnectError);
    socketService.onNative('reconnect', handleReconnect);
    
    // Set up enhanced error handling listeners
    socketService.onError(handleError);
    socketService.onRecovery(handleRecovery);

    // Check initial connection state
    setIsConnected(socketService.isConnected());
    setSocketId(socketService.getSocketId());
    
    const currentError = socketService.getCurrentError();
    if (currentError) {
      setError(currentError.userMessage);
      setErrorDetails(currentError);
      if (currentError.canRetry) {
        updateRetryCountdown(currentError);
      }
    }
    
    updateConnectionHealth();

    // Cleanup function
    return () => {
      socketService.offNative('connect', handleConnect);
      socketService.offNative('disconnect', handleDisconnect);
      socketService.offNative('connect_error', handleConnectError);
      socketService.offNative('reconnect', handleReconnect);
      socketService.offError(handleError);
      socketService.offRecovery(handleRecovery);
      
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [updateConnectionHealth, updateRetryCountdown]);

  // Auto-connect on mount if not connected
  useEffect(() => {
    if (!isConnected && !isConnecting && !error) {
      connect();
    }
  }, [isConnected, isConnecting, error, connect]);

  // Health check interval
  useEffect(() => {
    const healthCheckInterval = setInterval(updateConnectionHealth, GAME_CONSTANTS.SOCKET.HEALTH_CHECK_INTERVAL); // Configurable health check interval
    return () => clearInterval(healthCheckInterval);
  }, [updateConnectionHealth]);

  return {
    isConnected,
    isConnecting,
    socketId,
    error,
    errorDetails,
    connectionHealth,
    connect,
    disconnect,
    reconnect,
    forceReconnect,
    clearError,
    canRetry: errorDetails?.canRetry ?? false,
    retryIn,
  };
};