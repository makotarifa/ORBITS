import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../../services/socket/socket.service';
import { PlayerMoveDto, PlayerPositionDto } from '../../types/game-events.types';

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

    // Send position to server (server handles throttling)
    const positionData: PlayerPositionDto = {
      roomId: currentRoom,
      position,
      rotation,
      velocity: player.velocity,
    };

    socketService.sendPlayerPosition(positionData);
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
      // No cleanup needed since we removed throttling
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