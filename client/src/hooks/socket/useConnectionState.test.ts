import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConnectionState } from './useConnectionState';
import { socketService } from '../../services/socket/socket.service';
import { useGameStore } from '../../stores/game.store';

// Mock the socket service
vi.mock('../../services/socket/socket.service', () => ({
  socketService: {
    isConnected: vi.fn(),
    getSocketId: vi.fn(),
    onNative: vi.fn(),
    offNative: vi.fn(),
  }
}));

// Mock the game store
vi.mock('../../stores/game.store', () => ({
  useGameStore: vi.fn(),
}));

describe('useConnectionState', () => {
  const mockSocketService = vi.mocked(socketService);
  const mockUseGameStore = vi.mocked(useGameStore);
  
  const mockStore = {
    setConnected: vi.fn(),
    setReconnecting: vi.fn(),
    setConnectionError: vi.fn(),
    setSocketId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameStore.mockReturnValue(mockStore as any);
    mockSocketService.isConnected.mockReturnValue(false);
    mockSocketService.getSocketId.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with current socket state', () => {
    mockSocketService.isConnected.mockReturnValue(true);
    mockSocketService.getSocketId.mockReturnValue('socket-123');

    const { result } = renderHook(() => useConnectionState());

    expect(mockStore.setConnected).toHaveBeenCalledWith(true);
    expect(mockStore.setSocketId).toHaveBeenCalledWith('socket-123');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.socketId).toBe('socket-123');
  });

  it('should set up socket event listeners on mount', () => {
    renderHook(() => useConnectionState());

    expect(mockSocketService.onNative).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('reconnecting', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('reconnect_error', expect.any(Function));
    expect(mockSocketService.onNative).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
  });

  it('should handle connect event', () => {
    let connectHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'connect') connectHandler = handler;
    });
    mockSocketService.getSocketId.mockReturnValue('socket-123');

    renderHook(() => useConnectionState());

    // Simulate connect event
    connectHandler();

    expect(mockStore.setConnected).toHaveBeenCalledWith(true);
    expect(mockStore.setSocketId).toHaveBeenCalledWith('socket-123');
    expect(mockStore.setConnectionError).toHaveBeenCalledWith(null);
  });

  it('should handle disconnect event with reason', () => {
    let disconnectHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'disconnect') disconnectHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate disconnect event
    disconnectHandler('transport close');

    expect(mockStore.setConnected).toHaveBeenCalledWith(false);
    expect(mockStore.setSocketId).toHaveBeenCalledWith(null);
    expect(mockStore.setConnectionError).toHaveBeenCalledWith('Disconnected: transport close');
  });

  it('should not set error for normal client disconnect', () => {
    let disconnectHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'disconnect') disconnectHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate client disconnect
    disconnectHandler('io client disconnect');

    expect(mockStore.setConnected).toHaveBeenCalledWith(false);
    expect(mockStore.setSocketId).toHaveBeenCalledWith(null);
    expect(mockStore.setConnectionError).not.toHaveBeenCalled();
  });

  it('should handle connect_error event', () => {
    let connectErrorHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'connect_error') connectErrorHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate connect error
    const error = new Error('Connection timeout');
    connectErrorHandler(error);

    expect(mockStore.setConnected).toHaveBeenCalledWith(false);
    expect(mockStore.setReconnecting).toHaveBeenCalledWith(false);
    expect(mockStore.setConnectionError).toHaveBeenCalledWith('Connection timeout');
  });

  it('should handle reconnecting event', () => {
    let reconnectingHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'reconnecting') reconnectingHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate reconnecting
    reconnectingHandler(1);

    expect(mockStore.setReconnecting).toHaveBeenCalledWith(true);
    expect(mockStore.setConnectionError).toHaveBeenCalledWith(null);
  });

  it('should handle reconnect event', () => {
    let reconnectHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'reconnect') reconnectHandler = handler;
    });
    mockSocketService.getSocketId.mockReturnValue('socket-456');

    renderHook(() => useConnectionState());

    // Simulate successful reconnect
    reconnectHandler(2);

    expect(mockStore.setConnected).toHaveBeenCalledWith(true);
    expect(mockStore.setReconnecting).toHaveBeenCalledWith(false);
    expect(mockStore.setSocketId).toHaveBeenCalledWith('socket-456');
    expect(mockStore.setConnectionError).toHaveBeenCalledWith(null);
  });

  it('should handle reconnect_error event', () => {
    let reconnectErrorHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'reconnect_error') reconnectErrorHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate reconnection error
    const error = new Error('Reconnection failed');
    reconnectErrorHandler(error);

    expect(mockStore.setConnectionError).toHaveBeenCalledWith('Reconnection failed: Reconnection failed');
  });

  it('should handle reconnect_failed event', () => {
    let reconnectFailedHandler: Function = () => {};
    
    mockSocketService.onNative.mockImplementation((event, handler) => {
      if (event === 'reconnect_failed') reconnectFailedHandler = handler;
    });

    renderHook(() => useConnectionState());

    // Simulate reconnection permanently failed
    reconnectFailedHandler();

    expect(mockStore.setConnected).toHaveBeenCalledWith(false);
    expect(mockStore.setReconnecting).toHaveBeenCalledWith(false);
    expect(mockStore.setConnectionError).toHaveBeenCalledWith('Unable to reconnect to server');
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useConnectionState());

    unmount();

    expect(mockSocketService.offNative).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('reconnecting', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('reconnect_error', expect.any(Function));
    expect(mockSocketService.offNative).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
  });

  it('should return current socket state', () => {
    mockSocketService.isConnected.mockReturnValue(true);
    mockSocketService.getSocketId.mockReturnValue('socket-789');

    const { result } = renderHook(() => useConnectionState());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.socketId).toBe('socket-789');
  });

  it('should handle undefined socket id', () => {
    mockSocketService.getSocketId.mockReturnValue(undefined);

    const { result } = renderHook(() => useConnectionState());

    expect(mockStore.setSocketId).toHaveBeenCalledWith(null);
    expect(result.current.socketId).toBeUndefined();
  });
});