import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../../services/socket/socket.service';

export interface UseSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  socketId: string | undefined;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async (): Promise<void> => {
    if (isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      await socketService.connect();
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('Socket connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected]);

  const disconnect = useCallback((): void => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
    setError(null);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    await connect();
  }, [connect, disconnect]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(socketService.getSocketId());
      setError(null);
      console.log('Socket connected:', socketService.getSocketId());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(undefined);
      console.log('Socket disconnected');
    };

    const handleConnectError = (err: Error) => {
      setIsConnecting(false);
      setError(err.message || 'Connection error');
      console.error('Socket connection error:', err);
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(socketService.getSocketId());
      setError(null);
      console.log('Socket reconnected:', socketService.getSocketId());
    };

    // Set up event listeners
    socketService.onNative('connect', handleConnect);
    socketService.onNative('disconnect', handleDisconnect);
    socketService.onNative('connect_error', handleConnectError);
    socketService.onNative('reconnect', handleReconnect);

    // Check initial connection state
    setIsConnected(socketService.isConnected());
    setSocketId(socketService.getSocketId());

    // Cleanup function
    return () => {
      socketService.offNative('connect', handleConnect);
      socketService.offNative('disconnect', handleDisconnect);
      socketService.offNative('connect_error', handleConnectError);
      socketService.offNative('reconnect', handleReconnect);
    };
  }, []);

  // Auto-connect on mount if not connected
  useEffect(() => {
    if (!isConnected && !isConnecting && !error) {
      connect();
    }
  }, [isConnected, isConnecting, error, connect]);

  return {
    isConnected,
    isConnecting,
    socketId,
    error,
    connect,
    disconnect,
    reconnect,
  };
};