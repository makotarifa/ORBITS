import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useGameEvents } from './useGameEvents';
import { socketService } from '../../services/socket/socket.service';

vi.mock('../../services/socket/socket.service', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

describe('useGameEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all event handler functions', () => {
    const { result } = renderHook(() => useGameEvents());

    expect(result.current.onPlayerJoined).toBeDefined();
    expect(typeof result.current.onPlayerJoined).toBe('function');

    expect(result.current.onPlayerLeft).toBeDefined();
    expect(typeof result.current.onPlayerLeft).toBe('function');

    expect(result.current.onPlayerMoved).toBeDefined();
    expect(typeof result.current.onPlayerMoved).toBe('function');

    expect(result.current.onPositionUpdate).toBeDefined();
    expect(typeof result.current.onPositionUpdate).toBe('function');

    expect(result.current.onRoomJoined).toBeDefined();
    expect(typeof result.current.onRoomJoined).toBe('function');

    expect(result.current.onRoomLeft).toBeDefined();
    expect(typeof result.current.onRoomLeft).toBe('function');

    expect(result.current.onError).toBeDefined();
    expect(typeof result.current.onError).toBe('function');

    expect(result.current.onServerInfo).toBeDefined();
    expect(typeof result.current.onServerInfo).toBe('function');

    expect(result.current.onClientsCount).toBeDefined();
    expect(typeof result.current.onClientsCount).toBe('function');

    expect(result.current.onPong).toBeDefined();
    expect(typeof result.current.onPong).toBe('function');
  });

  it('should register player-joined event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onPlayerJoined(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('player-joined', mockCallback);
    expect(typeof cleanup).toBe('function');

    // Test cleanup
    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('player-joined', mockCallback);
  });

  it('should register player-left event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onPlayerLeft(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('player-left', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('player-left', mockCallback);
  });

  it('should register player-moved event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onPlayerMoved(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('player-moved', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('player-moved', mockCallback);
  });

  it('should register position-update event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onPositionUpdate(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('position-update', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('position-update', mockCallback);
  });

  it('should register room-joined event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onRoomJoined(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('room-joined', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('room-joined', mockCallback);
  });

  it('should register room-left event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onRoomLeft(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('room-left', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('room-left', mockCallback);
  });

  it('should register error event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onError(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('error', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('error', mockCallback);
  });

  it('should register server-info event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onServerInfo(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('server-info', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('server-info', mockCallback);
  });

  it('should register clients-count event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onClientsCount(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('clients-count', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('clients-count', mockCallback);
  });

  it('should register pong event listener and return cleanup function', () => {
    const { result } = renderHook(() => useGameEvents());

    const mockCallback = vi.fn();
    const cleanup = result.current.onPong(mockCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('pong', mockCallback);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(vi.mocked(socketService).off).toHaveBeenCalledWith('pong', mockCallback);
  });

  it('should cleanup all listeners on unmount', () => {
    const { unmount } = renderHook(() => useGameEvents());

    unmount();

    expect(vi.mocked(socketService).removeAllListeners).toHaveBeenCalled();
  });

  it('should handle multiple event registrations', () => {
    const { result } = renderHook(() => useGameEvents());

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Register multiple callbacks for the same event
    const cleanup1 = result.current.onPlayerJoined(callback1);
    const cleanup2 = result.current.onPlayerJoined(callback2);

    expect(vi.mocked(socketService).on).toHaveBeenCalledTimes(2);
    expect(vi.mocked(socketService).on).toHaveBeenNthCalledWith(1, 'player-joined', callback1);
    expect(vi.mocked(socketService).on).toHaveBeenNthCalledWith(2, 'player-joined', callback2);

    // Cleanup both
    cleanup1();
    cleanup2();

    expect(vi.mocked(socketService).off).toHaveBeenCalledTimes(2);
    expect(vi.mocked(socketService).off).toHaveBeenNthCalledWith(1, 'player-joined', callback1);
    expect(vi.mocked(socketService).off).toHaveBeenNthCalledWith(2, 'player-joined', callback2);
  });

  it('should handle different event types independently', () => {
    const { result } = renderHook(() => useGameEvents());

    const playerCallback = vi.fn();
    const roomCallback = vi.fn();
    const errorCallback = vi.fn();

    result.current.onPlayerJoined(playerCallback);
    result.current.onRoomJoined(roomCallback);
    result.current.onError(errorCallback);

    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('player-joined', playerCallback);
    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('room-joined', roomCallback);
    expect(vi.mocked(socketService).on).toHaveBeenCalledWith('error', errorCallback);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useGameEvents());

    const firstOnPlayerJoined = result.current.onPlayerJoined;
    const firstOnPlayerLeft = result.current.onPlayerLeft;

    rerender();

    expect(result.current.onPlayerJoined).toBe(firstOnPlayerJoined);
    expect(result.current.onPlayerLeft).toBe(firstOnPlayerLeft);
  });
});