import { useState, useCallback, useEffect, useRef } from 'react';
import { socketService } from '../../services/socket/socket.service';
import { PlayerMoveDto, PlayerPositionDto } from '../../types/game-events.types';
import { GAME_CONSTANTS } from '../../constants/game.constants';

export interface PlayerState {
  id: string;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
  isMoving: boolean;
  lastUpdate: number;
}

export interface UsePlayerReturn {
  player: PlayerState | null;
  isInRoom: boolean;
  currentRoom: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  updatePosition: (position: { x: number; y: number }, rotation?: number) => void;
  updateVelocity: (velocity: { x: number; y: number }) => void;
  sendMove: (targetPosition: { x: number; y: number }) => void;
  setMoving: (isMoving: boolean) => void;
}

export const usePlayer = (): UsePlayerReturn => {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionUpdateRef = useRef<number>(0);

  // Initialize player when socket connects
  useEffect(() => {
    const handleConnect = () => {
      const socketId = socketService.getSocketId();
      if (socketId && !player) {
        setPlayer({
          id: socketId,
          position: { x: 0, y: 0 },
          rotation: 0,
          velocity: { x: 0, y: 0 },
          isMoving: false,
          lastUpdate: Date.now(),
        });
      }
    };

    socketService.onNative('connect', handleConnect);

    // Initialize if already connected
    if (socketService.isConnected() && !player) {
      handleConnect();
    }

    return () => {
      socketService.offNative('connect', handleConnect);
    };
  }, [player]);

  const joinRoom = useCallback((roomId: string) => {
    if (!player) return;

    socketService.joinRoom(roomId);
    setCurrentRoom(roomId);
    setIsInRoom(true);
  }, [player]);

  const leaveRoom = useCallback(() => {
    if (!currentRoom) return;

    socketService.leaveRoom(currentRoom);
    setCurrentRoom(null);
    setIsInRoom(false);
  }, [currentRoom]);

  const updatePosition = useCallback((position: { x: number; y: number }, rotation: number = 0) => {
    if (!player || !currentRoom) return;

    const now = Date.now();
    const updatedPlayer: PlayerState = {
      ...player,
      position,
      rotation,
      lastUpdate: now,
    };

    setPlayer(updatedPlayer);

    // Throttle position updates to server
    if (now - lastPositionUpdateRef.current > GAME_CONSTANTS.LIMITS.POSITION_UPDATE_THROTTLE) {
      lastPositionUpdateRef.current = now;

      const positionData: PlayerPositionDto = {
        roomId: currentRoom,
        position,
        rotation,
        velocity: player.velocity,
      };

      socketService.sendPlayerPosition(positionData);
    }

    // Schedule update if not already scheduled and we're in the throttle window
    if (positionUpdateTimeoutRef.current === null &&
        now - lastPositionUpdateRef.current <= GAME_CONSTANTS.LIMITS.POSITION_UPDATE_THROTTLE) {
      const timeoutId = setTimeout(() => {
        if (player && currentRoom) {
          const positionData: PlayerPositionDto = {
            roomId: currentRoom,
            position: player.position,
            rotation: player.rotation,
            velocity: player.velocity,
          };
          socketService.sendPlayerPosition(positionData);
          positionUpdateTimeoutRef.current = null;
        }
      }, GAME_CONSTANTS.LIMITS.POSITION_UPDATE_THROTTLE - (now - lastPositionUpdateRef.current));

      positionUpdateTimeoutRef.current = timeoutId;
    }
  }, [player, currentRoom]);

  const updateVelocity = useCallback((velocity: { x: number; y: number }) => {
    if (!player) return;

    setPlayer(prev => prev ? { ...prev, velocity } : null);
  }, [player]);

  const sendMove = useCallback((targetPosition: { x: number; y: number }) => {
    if (!player || !currentRoom) return;

    const moveData: PlayerMoveDto = {
      roomId: currentRoom,
      position: targetPosition,
    };

    socketService.sendPlayerMove(moveData);
  }, [player, currentRoom]);

  const setMoving = useCallback((isMoving: boolean) => {
    if (!player) return;

    setPlayer(prev => prev ? { ...prev, isMoving } : null);
  }, [player]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
    };
  }, []);

  return {
    player,
    isInRoom,
    currentRoom,
    joinRoom,
    leaveRoom,
    updatePosition,
    updateVelocity,
    sendMove,
    setMoving,
  };
};