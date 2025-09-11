import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../stores/game.store';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().reset();
  });

  describe('Connection State', () => {
    it('should initialize with default connection state', () => {
      const state = useGameStore.getState();

      expect(state.isConnected).toBe(false);
      expect(state.connectionError).toBeNull();
      expect(state.socketId).toBeNull();
    });

    it('should update connection state', () => {
      const { setConnected, setConnectionError, setSocketId } = useGameStore.getState();

      setConnected(true);
      setSocketId('test-socket-id');
      setConnectionError('Test error');

      const state = useGameStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.socketId).toBe('test-socket-id');
      expect(state.connectionError).toBe('Test error');
    });
  });

  describe('Room State', () => {
    it('should initialize with default room state', () => {
      const state = useGameStore.getState();

      expect(state.currentRoom).toBeNull();
      expect(state.availableRooms).toEqual([]);
      expect(state.roomPlayers).toBeInstanceOf(Map);
      expect(state.roomPlayerCount).toBe(0);
    });

    it('should update room state', () => {
      const { setCurrentRoom, setAvailableRooms, setRoomPlayerCount } = useGameStore.getState();

      setCurrentRoom('test-room');
      setAvailableRooms(['room1', 'room2']);
      setRoomPlayerCount(5);

      const state = useGameStore.getState();
      expect(state.currentRoom).toBe('test-room');
      expect(state.availableRooms).toEqual(['room1', 'room2']);
      expect(state.roomPlayerCount).toBe(5);
    });
  });

  describe('Player Management', () => {
    it('should add room players', () => {
      const { addRoomPlayer } = useGameStore.getState();

      const playerState = {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        lastUpdate: Date.now(),
      };

      addRoomPlayer('player1', playerState);

      const { roomPlayers } = useGameStore.getState();
      expect(roomPlayers.has('player1')).toBe(true);
      expect(roomPlayers.get('player1')).toEqual(playerState);
    });

    it('should update room players', () => {
      const { addRoomPlayer, updateRoomPlayer } = useGameStore.getState();

      const initialState = {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        lastUpdate: Date.now(),
      };

      addRoomPlayer('player1', initialState);

      const updatedState = {
        position: { x: 150, y: 250 },
        rotation: Math.PI / 2,
      };

      updateRoomPlayer('player1', updatedState);

      const { roomPlayers } = useGameStore.getState();
      const player = roomPlayers.get('player1');
      expect(player?.position).toEqual({ x: 150, y: 250 });
      expect(player?.rotation).toBe(Math.PI / 2);
      expect(player?.velocity).toEqual({ x: 0, y: 0 }); // Should remain unchanged
    });

    it('should remove room players', () => {
      const { addRoomPlayer, removeRoomPlayer } = useGameStore.getState();

      const playerState = {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        lastUpdate: Date.now(),
      };

      addRoomPlayer('player1', playerState);

      const stateAfterAdd = useGameStore.getState();
      expect(stateAfterAdd.roomPlayers.has('player1')).toBe(true);

      removeRoomPlayer('player1');

      const stateAfterRemove = useGameStore.getState();
      expect(stateAfterRemove.roomPlayers.has('player1')).toBe(false);
    });

    it('should clear all room players', () => {
      const { addRoomPlayer, clearRoomPlayers } = useGameStore.getState();

      const playerState = {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        lastUpdate: Date.now(),
      };

      addRoomPlayer('player1', playerState);
      addRoomPlayer('player2', playerState);

      const stateAfterAdd = useGameStore.getState();
      expect(stateAfterAdd.roomPlayers.size).toBe(2);

      clearRoomPlayers();

      const stateAfterClear = useGameStore.getState();
      expect(stateAfterClear.roomPlayers.size).toBe(0);
    });
  });

  describe('Local Player State', () => {
    it('should initialize with default local player state', () => {
      const state = useGameStore.getState();

      expect(state.localPlayerId).toBeNull();
      expect(state.localPlayerState).toBeNull();
    });

    it('should update local player state', () => {
      const { setLocalPlayerId, setLocalPlayerState, updateLocalPlayerState } = useGameStore.getState();

      const playerState = {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 10, y: 5 },
        lastUpdate: Date.now(),
      };

      setLocalPlayerId('local-player');
      setLocalPlayerState(playerState);

      let state = useGameStore.getState();
      expect(state.localPlayerId).toBe('local-player');
      expect(state.localPlayerState).toEqual(playerState);

      // Test partial update
      updateLocalPlayerState({
        position: { x: 150, y: 250 },
        velocity: { x: 20, y: 10 },
      });

      state = useGameStore.getState();
      expect(state.localPlayerState?.position).toEqual({ x: 150, y: 250 });
      expect(state.localPlayerState?.velocity).toEqual({ x: 20, y: 10 });
      expect(state.localPlayerState?.rotation).toBe(0); // Should remain unchanged
    });
  });

  describe('Server Info', () => {
    it('should update server info', () => {
      const { setServerInfo } = useGameStore.getState();

      const serverInfo = {
        connectedClients: 42,
        activeRooms: 5,
      };

      setServerInfo(serverInfo);

      const state = useGameStore.getState();
      expect(state.serverInfo).toEqual(serverInfo);
    });
  });

  describe('UI State', () => {
    it('should update loading state', () => {
      const { setLoading } = useGameStore.getState();

      setLoading(true);
      expect(useGameStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useGameStore.getState().isLoading).toBe(false);
    });

    it('should update last update timestamp', () => {
      const { updateLastUpdate } = useGameStore.getState();
      const beforeUpdate = Date.now();

      updateLastUpdate();

      const afterUpdate = useGameStore.getState().lastUpdate;
      expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset store to initial state', () => {
      const {
        setConnected,
        setCurrentRoom,
        addRoomPlayer,
        setLocalPlayerId,
        setServerInfo,
        reset
      } = useGameStore.getState();

      // Modify state
      setConnected(true);
      setCurrentRoom('test-room');
      addRoomPlayer('player1', {
        position: { x: 0, y: 0 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        lastUpdate: Date.now(),
      });
      setLocalPlayerId('local-player');
      setServerInfo({ connectedClients: 10, activeRooms: 2 });

      // Verify state is modified
      let state = useGameStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.currentRoom).toBe('test-room');
      expect(state.roomPlayers.size).toBe(1);
      expect(state.localPlayerId).toBe('local-player');
      expect(state.serverInfo).toBeDefined();

      // Reset
      reset();

      // Verify state is reset
      state = useGameStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.currentRoom).toBeNull();
      expect(state.roomPlayers.size).toBe(0);
      expect(state.localPlayerId).toBeNull();
      expect(state.serverInfo).toBeNull();
    });
  });
});