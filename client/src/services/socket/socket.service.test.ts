import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { SocketService, socketService } from '../../services/socket/socket.service';
import { GAME_CONSTANTS } from '../../constants/game.constants';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('SocketService', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock socket
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      connected: true,
      id: 'test-socket-id',
    };

    // Mock the io function to return our mock socket
    (io as any).mockReturnValue(mockSocket);

    // Reset the singleton instance
    (socketService as any).socket = mockSocket;
  });

  afterEach(() => {
    // Reset the singleton instance
    (socketService as any).socket = null;
  });

  describe('Connection Management', () => {
    it('should initialize socket with correct configuration', () => {
      // Create a new instance to test initialization
      const testService = new SocketService();

      // Verify that io was called with correct server URL and namespace
      expect(io).toHaveBeenCalledWith(
        `${GAME_CONSTANTS.DEFAULTS.SERVER_URL}${GAME_CONSTANTS.NAMESPACE}`,
        expect.objectContaining({
          transports: [...GAME_CONSTANTS.SOCKET.TRANSPORTS],
          timeout: GAME_CONSTANTS.SOCKET.TIMEOUT,
          forceNew: GAME_CONSTANTS.SOCKET.FORCE_NEW,
          reconnection: GAME_CONSTANTS.SOCKET.RECONNECTION,
          reconnectionAttempts: GAME_CONSTANTS.SOCKET.MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: GAME_CONSTANTS.SOCKET.RECONNECT_DELAY,
        })
      );

      // Clean up the test instance
      (testService as any).socket = null;
    });

    it('should connect successfully', async () => {
      mockSocket.connected = false;
      mockSocket.once = vi.fn((event, callback) => {
        if (event === 'connect') setTimeout(callback, 10);
      });

      await socketService.connect();

      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockSocket.connected = false;
      mockSocket.once = vi.fn((event, callback) => {
        if (event === 'connect_error') {
          callback(new Error('Connection failed'));
        }
      });

      await expect(socketService.connect()).rejects.toThrow('An unexpected connection error occurred. Please try again.');
    });

    it('should disconnect properly', () => {
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should return connection status', () => {
      expect(socketService.isConnected()).toBe(true);
    });

    it('should return socket id', () => {
      expect(socketService.getSocketId()).toBe('test-socket-id');
    });
  });

  describe('Event Handling', () => {
    it('should emit join-room event', () => {
      socketService.joinRoom('test-room');

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', { roomId: 'test-room' });
    });

    it('should emit leave-room event', () => {
      socketService.leaveRoom('test-room');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { roomId: 'test-room' });
    });

    it('should emit player-move event', () => {
      const moveData = {
        roomId: 'test-room',
        position: { x: 100, y: 200 },
      };

      socketService.sendPlayerMove(moveData);

      expect(mockSocket.emit).toHaveBeenCalledWith('player-move', moveData);
    });

    it('should emit player-position event', () => {
      const positionData = {
        roomId: 'test-room',
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
      };

      socketService.sendPlayerPosition(positionData);

      expect(mockSocket.emit).toHaveBeenCalledWith('player-position', positionData);
    });

    it('should emit ping event', () => {
      socketService.ping();

      expect(mockSocket.emit).toHaveBeenCalledWith('ping', undefined);
    });

    it('should emit get-server-info event', () => {
      socketService.getServerInfo();

      expect(mockSocket.emit).toHaveBeenCalledWith('get-server-info', undefined);
    });
  });

  describe('Event Listeners', () => {
    it('should register native event listeners', () => {
      const callback = vi.fn();
      socketService.onNative('connect', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('connect', callback);
    });

    it('should unregister native event listeners', () => {
      const callback = vi.fn();
      socketService.offNative('connect', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('connect', callback);
    });

    it('should register one-time native event listeners', () => {
      const callback = vi.fn();
      socketService.onceNative('connect', callback);

      expect(mockSocket.once).toHaveBeenCalledWith('connect', callback);
    });

    it('should register game event listeners', () => {
      const callback = vi.fn();
      socketService.on('player-joined', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-joined', callback);
    });

    it('should unregister game event listeners', () => {
      const callback = vi.fn();
      socketService.off('player-joined', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('player-joined', callback);
    });
  });

  describe('Cleanup', () => {
    it('should remove all listeners on destroy', () => {
      socketService.destroy();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      socketService.removeAllListeners();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    });
  });
});