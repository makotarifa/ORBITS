import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../../services/socket/socket.service';
import { useGameStore, useLatencyState } from '../../stores';
import { GAME_CONSTANTS } from '../../constants/game.constants';
import { PongEvent } from '../../types/game-events.types';

export interface UseLatencyReturn {
  latency: number | null;
  averageLatency: number | null;
  isLatencyMeasuring: boolean;
  startLatencyMeasurement: () => void;
  stopLatencyMeasurement: () => void;
  getLatencyQuality: () => 'good' | 'okay' | 'poor' | 'unknown';
}

export const useLatency = (): UseLatencyReturn => {
  const {
    latency,
    averageLatency,
    isLatencyMeasuring,
  } = useLatencyState();

  const {
    addLatencyMeasurement,
    setLatencyMeasuring,
    clearLatencyHistory,
  } = useGameStore();

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartTimeRef = useRef<number | null>(null);

  const getLatencyQuality = useCallback((): 'good' | 'okay' | 'poor' | 'unknown' => {
    const currentLatency = averageLatency ?? latency;
    
    if (currentLatency === null) {
      return 'unknown';
    }
    
    if (currentLatency < GAME_CONSTANTS.LATENCY.GOOD_THRESHOLD) {
      return 'good';
    } else if (currentLatency < GAME_CONSTANTS.LATENCY.OKAY_THRESHOLD) {
      return 'okay';
    } else {
      return 'poor';
    }
  }, [latency, averageLatency]);

  const handlePong = useCallback((data: PongEvent) => {
    if (pingStartTimeRef.current !== null) {
      const endTime = Date.now();
      const pingTime = endTime - pingStartTimeRef.current;
      
      // Clear the timeout since we received a response
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      
      // Add measurement to store
      addLatencyMeasurement(pingTime);
      
      console.log(`Ping: ${pingTime}ms`);
    }
    
    pingStartTimeRef.current = null;
  }, [addLatencyMeasurement]);

  const sendPing = useCallback(() => {
    if (!socketService.isConnected()) {
      return;
    }

    // Clear any existing timeout
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }

    // Record the start time
    pingStartTimeRef.current = Date.now();
    
    // Set timeout for no response
    pingTimeoutRef.current = setTimeout(() => {
      console.warn('Ping timeout - no pong received');
      pingStartTimeRef.current = null;
      pingTimeoutRef.current = null;
    }, GAME_CONSTANTS.LATENCY.TIMEOUT);

    // Send the ping
    socketService.ping();
  }, []);

  const startLatencyMeasurement = useCallback(() => {
    if (isLatencyMeasuring) {
      return;
    }

    console.log('Starting latency measurement');
    setLatencyMeasuring(true);

    // Send initial ping immediately
    sendPing();

    // Set up recurring pings
    pingIntervalRef.current = setInterval(() => {
      sendPing();
    }, GAME_CONSTANTS.LATENCY.PING_INTERVAL);
  }, [isLatencyMeasuring, setLatencyMeasuring, sendPing]);

  const stopLatencyMeasurement = useCallback(() => {
    if (!isLatencyMeasuring) {
      return;
    }

    console.log('Stopping latency measurement');
    setLatencyMeasuring(false);

    // Clear interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Clear timeout
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }

    // Reset ping start time
    pingStartTimeRef.current = null;
  }, [isLatencyMeasuring, setLatencyMeasuring]);

  useEffect(() => {
    // Set up pong event listener
    socketService.on('pong', handlePong);

    return () => {
      socketService.off('pong', handlePong);
    };
  }, [handlePong]);

  // Auto-start measurement when connected, stop when disconnected
  useEffect(() => {
    if (socketService.isConnected() && !isLatencyMeasuring) {
      startLatencyMeasurement();
    } else if (!socketService.isConnected() && isLatencyMeasuring) {
      stopLatencyMeasurement();
      clearLatencyHistory();
    }
  }, [startLatencyMeasurement, stopLatencyMeasurement, clearLatencyHistory, isLatencyMeasuring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLatencyMeasurement();
    };
  }, [stopLatencyMeasurement]);

  // Listen to connection state changes
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected - starting latency measurement');
      startLatencyMeasurement();
    };

    const handleDisconnect = () => {
      console.log('Disconnected - stopping latency measurement');
      stopLatencyMeasurement();
      clearLatencyHistory();
    };

    socketService.onNative('connect', handleConnect);
    socketService.onNative('disconnect', handleDisconnect);

    return () => {
      socketService.offNative('connect', handleConnect);
      socketService.offNative('disconnect', handleDisconnect);
    };
  }, [startLatencyMeasurement, stopLatencyMeasurement, clearLatencyHistory]);

  return {
    latency,
    averageLatency,
    isLatencyMeasuring,
    startLatencyMeasurement,
    stopLatencyMeasurement,
    getLatencyQuality,
  };
};