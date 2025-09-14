import { useEffect } from 'react';
import { socketService } from '../../services/socket/socket.service';
import { useGameStore } from '../../stores/game.store';

/**
 * Hook that bridges socket connection events to the global game store.
 * This ensures the UI connection status is synchronized with actual socket state.
 */
export const useConnectionState = () => {
  const store = useGameStore();

  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected:', socketService.getSocketId());
      store.setConnected(true);
      store.setSocketId(socketService.getSocketId() || null);
      store.setConnectionError(null);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      store.setConnected(false);
      store.setSocketId(null);
      // Don't show an error for normal disconnections
      if (reason !== 'io client disconnect') {
        store.setConnectionError(`Disconnected: ${reason}`);
      }
    };

    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
      store.setConnected(false);
      store.setReconnecting(false);
      store.setConnectionError(error.message || 'Connection failed');
    };

    const handleReconnecting = (attemptNumber: number) => {
      console.log('Socket attempting to reconnect...', attemptNumber);
      store.setReconnecting(true);
      store.setConnectionError(null);
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      store.setConnected(true);
      store.setReconnecting(false);
      store.setSocketId(socketService.getSocketId() || null);
      store.setConnectionError(null);
    };

    const handleReconnectError = (error: Error) => {
      console.error('Socket reconnection error:', error);
      store.setConnectionError(`Reconnection failed: ${error.message}`);
    };

    const handleReconnectFailed = () => {
      console.error('Socket reconnection failed permanently');
      store.setConnected(false);
      store.setReconnecting(false);
      store.setConnectionError('Unable to reconnect to server');
    };

    // Set up socket event listeners
    socketService.onNative('connect', handleConnect);
    socketService.onNative('disconnect', handleDisconnect);
    socketService.onNative('connect_error', handleConnectError);
    socketService.onNative('reconnecting', handleReconnecting);
    socketService.onNative('reconnect', handleReconnect);
    socketService.onNative('reconnect_error', handleReconnectError);
    socketService.onNative('reconnect_failed', handleReconnectFailed);

    // Initialize state based on current socket status
    store.setConnected(socketService.isConnected());
    store.setSocketId(socketService.getSocketId() || null);

    // Cleanup listeners on unmount
    return () => {
      socketService.offNative('connect', handleConnect);
      socketService.offNative('disconnect', handleDisconnect);
      socketService.offNative('connect_error', handleConnectError);
      socketService.offNative('reconnecting', handleReconnecting);
      socketService.offNative('reconnect', handleReconnect);
      socketService.offNative('reconnect_error', handleReconnectError);
      socketService.offNative('reconnect_failed', handleReconnectFailed);
    };
  }, [store]);

  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId(),
  };
};