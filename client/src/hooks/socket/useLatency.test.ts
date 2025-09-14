import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLatency } from './useLatency';
import { socketService } from '../../services/socket/socket.service';
import { useGameStore, useLatencyState } from '../../stores';
import { GAME_CONSTANTS } from '../../constants/game.constants';

// Mock dependencies
vi.mock('../../services/socket/socket.service');
vi.mock('../../stores/game.store');
vi.mock('../../stores', () => ({
  useGameStore: vi.fn(),
  useLatencyState: vi.fn(),
}));

const mockSocketService = socketService as any;
const mockUseGameStore = useGameStore as any;
const mockUseLatencyState = useLatencyState as any;

// Mock store state
const createMockStore = (overrides = {}) => ({
  latency: null,
  latencyHistory: [],
  averageLatency: null,
  isLatencyMeasuring: false,
  addLatencyMeasurement: vi.fn(),
  setLatencyMeasuring: vi.fn(),
  clearLatencyHistory: vi.fn(),
  ...overrides,
});

describe('useLatency', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockStore = createMockStore();
    
    // Mock useGameStore and useLatencyState
    mockUseGameStore.mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStore);
      }
      return mockStore;
    });

    mockUseLatencyState.mockReturnValue({
      latency: mockStore.latency,
      latencyHistory: mockStore.latencyHistory,
      averageLatency: mockStore.averageLatency,
      isLatencyMeasuring: mockStore.isLatencyMeasuring,
    });

    // Mock socket service methods
    mockSocketService.isConnected.mockReturnValue(true);
    mockSocketService.on.mockImplementation(() => {});
    mockSocketService.off.mockImplementation(() => {});
    mockSocketService.onNative.mockImplementation(() => {});
    mockSocketService.offNative.mockImplementation(() => {});
    mockSocketService.ping.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLatency());

      expect(result.current.latency).toBeNull();
      expect(result.current.averageLatency).toBeNull();
      expect(result.current.isLatencyMeasuring).toBe(false);
      expect(result.current.getLatencyQuality()).toBe('unknown');
    });

    it('should set up socket event listeners on mount', () => {
      renderHook(() => useLatency());

      expect(mockSocketService.on).toHaveBeenCalledWith('pong', expect.any(Function));
      expect(mockSocketService.onNative).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocketService.onNative).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useLatency());

      unmount();

      expect(mockSocketService.off).toHaveBeenCalledWith('pong', expect.any(Function));
      expect(mockSocketService.offNative).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocketService.offNative).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('latency quality calculation', () => {
    it('should return "good" for latency under good threshold', () => {
      mockStore.latency = 30;
      const { result } = renderHook(() => useLatency());

      expect(result.current.getLatencyQuality()).toBe('good');
    });

    it('should return "okay" for latency between good and okay thresholds', () => {
      mockStore.latency = 100;
      const { result } = renderHook(() => useLatency());

      expect(result.current.getLatencyQuality()).toBe('okay');
    });

    it('should return "poor" for latency above okay threshold', () => {
      mockStore.latency = 200;
      const { result } = renderHook(() => useLatency());

      expect(result.current.getLatencyQuality()).toBe('poor');
    });

    it('should return "unknown" for null latency', () => {
      mockStore.latency = null;
      const { result } = renderHook(() => useLatency());

      expect(result.current.getLatencyQuality()).toBe('unknown');
    });

    it('should prefer average latency over current latency', () => {
      mockStore.latency = 200; // poor
      mockStore.averageLatency = 40; // good
      const { result } = renderHook(() => useLatency());

      expect(result.current.getLatencyQuality()).toBe('good');
    });
  });

  describe('latency measurement', () => {
    it('should start measurement when calling startLatencyMeasurement', () => {
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.startLatencyMeasurement();
      });

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(true);
      expect(mockSocketService.ping).toHaveBeenCalled();
    });

    it('should not start measurement if already measuring', () => {
      mockStore.isLatencyMeasuring = true;
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.startLatencyMeasurement();
      });

      expect(mockStore.setLatencyMeasuring).not.toHaveBeenCalled();
    });

    it('should stop measurement when calling stopLatencyMeasurement', () => {
      mockStore.isLatencyMeasuring = true;
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.stopLatencyMeasurement();
      });

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(false);
    });

    it('should send ping at regular intervals when measuring', () => {
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.startLatencyMeasurement();
      });

      expect(mockSocketService.ping).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(GAME_CONSTANTS.LATENCY.PING_INTERVAL);
      });

      expect(mockSocketService.ping).toHaveBeenCalledTimes(2);
    });

    it('should not send ping when not connected', () => {
      mockSocketService.isConnected.mockReturnValue(false);
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.startLatencyMeasurement();
      });

      act(() => {
        vi.advanceTimersByTime(GAME_CONSTANTS.LATENCY.PING_INTERVAL);
      });

      expect(mockSocketService.ping).not.toHaveBeenCalled();
    });
  });

  describe('pong handling', () => {
    it('should calculate latency when receiving pong', () => {
      const { result } = renderHook(() => useLatency());
      
      act(() => {
        result.current.startLatencyMeasurement();
      });

      // Get the pong handler that was registered
      const pongHandler = mockSocketService.on.mock.calls.find(
        call => call[0] === 'pong'
      )?.[1];

      expect(pongHandler).toBeDefined();

      // Advance time to simulate ping delay
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Simulate pong response
      act(() => {
        pongHandler?.({ timestamp: new Date().toISOString() });
      });

      expect(mockStore.addLatencyMeasurement).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle timeout when no pong received', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLatency());

      act(() => {
        result.current.startLatencyMeasurement();
      });

      // Advance time beyond timeout
      act(() => {
        vi.advanceTimersByTime(GAME_CONSTANTS.LATENCY.TIMEOUT + 100);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Ping timeout - no pong received');

      consoleSpy.mockRestore();
    });
  });

  describe('connection state handling', () => {
    it('should start measurement when connected and not measuring', () => {
      mockSocketService.isConnected.mockReturnValue(true);
      mockStore.isLatencyMeasuring = false;

      const { result } = renderHook(() => useLatency());

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(true);
    });

    it('should stop measurement and clear history when disconnected', () => {
      mockSocketService.isConnected.mockReturnValue(false);
      mockStore.isLatencyMeasuring = true;

      renderHook(() => useLatency());

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(false);
      expect(mockStore.clearLatencyHistory).toHaveBeenCalled();
    });

    it('should handle connect event by starting measurement', () => {
      const { result } = renderHook(() => useLatency());

      // Get the connect handler
      const connectHandler = mockSocketService.onNative.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      expect(connectHandler).toBeDefined();

      act(() => {
        connectHandler?.();
      });

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(true);
    });

    it('should handle disconnect event by stopping measurement', () => {
      mockStore.isLatencyMeasuring = true;
      const { result } = renderHook(() => useLatency());

      // Get the disconnect handler
      const disconnectHandler = mockSocketService.onNative.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      expect(disconnectHandler).toBeDefined();

      act(() => {
        disconnectHandler?.();
      });

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(false);
      expect(mockStore.clearLatencyHistory).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should stop measurement on unmount', () => {
      mockStore.isLatencyMeasuring = true;
      const { unmount } = renderHook(() => useLatency());

      unmount();

      expect(mockStore.setLatencyMeasuring).toHaveBeenCalledWith(false);
    });
  });
});