import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePlayer } from './usePlayer';
import { socketService } from '../../services/socket/socket.service';

vi.mock('../../services/socket/socket.service', () => ({
  socketService: {
    onNative: vi.fn(),
    offNative: vi.fn(),
    isConnected: vi.fn(() => false),
    getSocketId: vi.fn(() => undefined as string | undefined),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    sendPlayerPosition: vi.fn(),
    sendPlayerMove: vi.fn(),
  },
}));

describe('usePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with null player and not in room', () => {
    const { result } = renderHook(() => usePlayer());

    expect(result.current.player).toBeNull();
    expect(result.current.isInRoom).toBe(false);
    expect(result.current.currentRoom).toBeNull();
  });

  it('should initialize player when socket connects', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    expect(result.current.player).toEqual({
      id: 'player-123',
      position: { x: 0, y: 0 },
      rotation: 0,
      velocity: { x: 0, y: 0 },
      isMoving: false,
      lastUpdate: expect.any(Number),
    });
  });

  it('should handle socket connect event', () => {
    vi.mocked(socketService).getSocketId.mockReturnValue('connected-player');

    const { result } = renderHook(() => usePlayer());

    // Simulate connect event
    const connectCall = vi.mocked(socketService).onNative.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    );
    expect(connectCall).toBeDefined();
    const connectHandler = connectCall![1];

    act(() => {
      connectHandler();
    });

    expect(result.current.player).toEqual({
      id: 'connected-player',
      position: { x: 0, y: 0 },
      rotation: 0,
      velocity: { x: 0, y: 0 },
      isMoving: false,
      lastUpdate: expect.any(Number),
    });
  });

  it('should not initialize player if already exists', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('existing-player');

    const { result } = renderHook(() => usePlayer());

    // Player should be initialized
    expect(result.current.player?.id).toBe('existing-player');

    // Simulate another connect event
    const connectCall = vi.mocked(socketService).onNative.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    );
    expect(connectCall).toBeDefined();
    const connectHandler = connectCall![1];

    act(() => {
      connectHandler();
    });

    // Player should remain the same
    expect(result.current.player?.id).toBe('existing-player');
  });

  it('should join room successfully', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    act(() => {
      result.current.joinRoom('test-room');
    });

    expect(vi.mocked(socketService).joinRoom).toHaveBeenCalledWith('test-room');
    expect(result.current.currentRoom).toBe('test-room');
    expect(result.current.isInRoom).toBe(true);
  });

  it('should not join room if player is null', () => {
    // Ensure no player is initialized
    vi.mocked(socketService).isConnected.mockReturnValue(false);
    vi.mocked(socketService).getSocketId.mockReturnValue(undefined);
    
    const { result } = renderHook(() => usePlayer());

    act(() => {
      result.current.joinRoom('test-room');
    });

    expect(vi.mocked(socketService).joinRoom).not.toHaveBeenCalled();
    expect(result.current.currentRoom).toBeNull();
    expect(result.current.isInRoom).toBe(false);
  });

  it('should leave room successfully', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    // Join room first
    act(() => {
      result.current.joinRoom('test-room');
    });

    // Then leave
    act(() => {
      result.current.leaveRoom();
    });

    expect(vi.mocked(socketService).leaveRoom).toHaveBeenCalledWith('test-room');
    expect(result.current.currentRoom).toBeNull();
    expect(result.current.isInRoom).toBe(false);
  });

  it('should not leave room if not in room', () => {
    const { result } = renderHook(() => usePlayer());

    act(() => {
      result.current.leaveRoom();
    });

    expect(vi.mocked(socketService).leaveRoom).not.toHaveBeenCalled();
  });

  it('should update position and send to server', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    // Join room first
    act(() => {
      result.current.joinRoom('test-room');
    });

    const newPosition = { x: 100, y: 200 };
    const rotation = Math.PI / 2;

    act(() => {
      result.current.updatePosition(newPosition, rotation);
    });

    expect(result.current.player?.position).toEqual(newPosition);
    expect(result.current.player?.rotation).toBe(rotation);
    expect(result.current.player?.lastUpdate).toBeGreaterThan(0);

    expect(vi.mocked(socketService).sendPlayerPosition).toHaveBeenCalledWith({
      roomId: 'test-room',
      position: newPosition,
      rotation,
      velocity: { x: 0, y: 0 }, // Initial velocity
    });
  });

  it('should not update position if not in room', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    const newPosition = { x: 100, y: 200 };

    act(() => {
      result.current.updatePosition(newPosition);
    });

    expect(vi.mocked(socketService).sendPlayerPosition).not.toHaveBeenCalled();
  });

  it('should not update position if player is null', () => {
    const { result } = renderHook(() => usePlayer());

    const newPosition = { x: 100, y: 200 };

    act(() => {
      result.current.updatePosition(newPosition);
    });

    expect(vi.mocked(socketService).sendPlayerPosition).not.toHaveBeenCalled();
  });

  it('should update velocity', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    const newVelocity = { x: 10, y: -5 };

    act(() => {
      result.current.updateVelocity(newVelocity);
    });

    expect(result.current.player?.velocity).toEqual(newVelocity);
  });

  it('should not update velocity if player is null', () => {
    // Ensure no player is initialized
    vi.mocked(socketService).isConnected.mockReturnValue(false);
    vi.mocked(socketService).getSocketId.mockReturnValue(undefined);
    
    const { result } = renderHook(() => usePlayer());

    const newVelocity = { x: 10, y: -5 };

    act(() => {
      result.current.updateVelocity(newVelocity);
    });

    // Should not crash
    expect(result.current.player).toBeNull();
  });

  it('should send move command', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    // Join room first
    act(() => {
      result.current.joinRoom('test-room');
    });

    const targetPosition = { x: 300, y: 400 };

    act(() => {
      result.current.sendMove(targetPosition);
    });

    expect(vi.mocked(socketService).sendPlayerMove).toHaveBeenCalledWith({
      roomId: 'test-room',
      position: targetPosition,
    });
  });

  it('should not send move if not in room', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    const targetPosition = { x: 300, y: 400 };

    act(() => {
      result.current.sendMove(targetPosition);
    });

    expect(vi.mocked(socketService).sendPlayerMove).not.toHaveBeenCalled();
  });

  it('should not send move if player is null', () => {
    const { result } = renderHook(() => usePlayer());

    const targetPosition = { x: 300, y: 400 };

    act(() => {
      result.current.sendMove(targetPosition);
    });

    expect(vi.mocked(socketService).sendPlayerMove).not.toHaveBeenCalled();
  });

  it('should set moving state', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    act(() => {
      result.current.setMoving(true);
    });

    expect(result.current.player?.isMoving).toBe(true);

    act(() => {
      result.current.setMoving(false);
    });

    expect(result.current.player?.isMoving).toBe(false);
  });

  it('should not set moving state if player is null', () => {
    // Ensure no player is initialized
    vi.mocked(socketService).isConnected.mockReturnValue(false);
    vi.mocked(socketService).getSocketId.mockReturnValue(undefined);
    
    const { result } = renderHook(() => usePlayer());

    act(() => {
      result.current.setMoving(true);
    });

    // Should not crash
    expect(result.current.player).toBeNull();
  });

  it('should handle default rotation value in updatePosition', () => {
    vi.mocked(socketService).isConnected.mockReturnValue(true);
    vi.mocked(socketService).getSocketId.mockReturnValue('player-123');

    const { result } = renderHook(() => usePlayer());

    // Join room first
    act(() => {
      result.current.joinRoom('test-room');
    });

    const newPosition = { x: 100, y: 200 };

    act(() => {
      result.current.updatePosition(newPosition); // No rotation provided
    });

    expect(result.current.player?.rotation).toBe(0); // Default rotation
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => usePlayer());

    unmount();

    expect(vi.mocked(socketService).offNative).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});