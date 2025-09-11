import { useEffect, useCallback } from 'react';
import { socketService } from '../../services/socket/socket.service';
import {
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerMovedEvent,
  PositionUpdateEvent,
  RoomJoinedEvent,
  RoomLeftEvent,
  ErrorEvent,
  ServerInfoEvent,
  ClientsCountEvent,
  PongEvent
} from '../../types/game-events.types';

export interface UseGameEventsReturn {
  onPlayerJoined: (callback: (data: PlayerJoinedEvent) => void) => () => void;
  onPlayerLeft: (callback: (data: PlayerLeftEvent) => void) => () => void;
  onPlayerMoved: (callback: (data: PlayerMovedEvent) => void) => () => void;
  onPositionUpdate: (callback: (data: PositionUpdateEvent) => void) => () => void;
  onRoomJoined: (callback: (data: RoomJoinedEvent) => void) => () => void;
  onRoomLeft: (callback: (data: RoomLeftEvent) => void) => () => void;
  onError: (callback: (data: ErrorEvent) => void) => () => void;
  onServerInfo: (callback: (data: ServerInfoEvent) => void) => () => void;
  onClientsCount: (callback: (data: ClientsCountEvent) => void) => () => void;
  onPong: (callback: (data: PongEvent) => void) => () => void;
}

export const useGameEvents = (): UseGameEventsReturn => {
  const onPlayerJoined = useCallback((callback: (data: PlayerJoinedEvent) => void) => {
    socketService.on('player-joined', callback);
    return () => socketService.off('player-joined', callback);
  }, []);

  const onPlayerLeft = useCallback((callback: (data: PlayerLeftEvent) => void) => {
    socketService.on('player-left', callback);
    return () => socketService.off('player-left', callback);
  }, []);

  const onPlayerMoved = useCallback((callback: (data: PlayerMovedEvent) => void) => {
    socketService.on('player-moved', callback);
    return () => socketService.off('player-moved', callback);
  }, []);

  const onPositionUpdate = useCallback((callback: (data: PositionUpdateEvent) => void) => {
    socketService.on('position-update', callback);
    return () => socketService.off('position-update', callback);
  }, []);

  const onRoomJoined = useCallback((callback: (data: RoomJoinedEvent) => void) => {
    socketService.on('room-joined', callback);
    return () => socketService.off('room-joined', callback);
  }, []);

  const onRoomLeft = useCallback((callback: (data: RoomLeftEvent) => void) => {
    socketService.on('room-left', callback);
    return () => socketService.off('room-left', callback);
  }, []);

  const onError = useCallback((callback: (data: ErrorEvent) => void) => {
    socketService.on('error', callback);
    return () => socketService.off('error', callback);
  }, []);

  const onServerInfo = useCallback((callback: (data: ServerInfoEvent) => void) => {
    socketService.on('server-info', callback);
    return () => socketService.off('server-info', callback);
  }, []);

  const onClientsCount = useCallback((callback: (data: ClientsCountEvent) => void) => {
    socketService.on('clients-count', callback);
    return () => socketService.off('clients-count', callback);
  }, []);

  const onPong = useCallback((callback: (data: PongEvent) => void) => {
    socketService.on('pong', callback);
    return () => socketService.off('pong', callback);
  }, []);

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  return {
    onPlayerJoined,
    onPlayerLeft,
    onPlayerMoved,
    onPositionUpdate,
    onRoomJoined,
    onRoomLeft,
    onError,
    onServerInfo,
    onClientsCount,
    onPong,
  };
};