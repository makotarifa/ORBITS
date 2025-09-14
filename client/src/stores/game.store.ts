import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PlayerState } from '../types/game-events.types';
import { GAME_CONSTANTS } from '../constants/game.constants';

export interface GameState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  socketId: string | null;

  // Latency state
  latency: number | null;
  latencyHistory: number[];
  averageLatency: number | null;
  isLatencyMeasuring: boolean;

  // Room state
  currentRoom: string | null;
  availableRooms: string[];
  roomPlayers: Map<string, PlayerState>;
  roomPlayerCount: number;

  // Server info
  serverInfo: {
    connectedClients: number;
    activeRooms: number;
  } | null;

  // Local player state
  localPlayerId: string | null;
  localPlayerState: PlayerState | null;

  // UI state
  isLoading: boolean;
  lastUpdate: number;
}

export interface GameActions {
  // Connection actions
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setSocketId: (socketId: string | null) => void;

  // Latency actions
  setLatency: (latency: number | null) => void;
  addLatencyMeasurement: (latency: number) => void;
  setLatencyMeasuring: (measuring: boolean) => void;
  clearLatencyHistory: () => void;

  // Room actions
  setCurrentRoom: (roomId: string | null) => void;
  setAvailableRooms: (rooms: string[]) => void;
  addRoomPlayer: (playerId: string, playerState: PlayerState) => void;
  updateRoomPlayer: (playerId: string, playerState: Partial<PlayerState>) => void;
  removeRoomPlayer: (playerId: string) => void;
  clearRoomPlayers: () => void;
  setRoomPlayerCount: (count: number) => void;

  // Server actions
  setServerInfo: (info: { connectedClients: number; activeRooms: number }) => void;

  // Local player actions
  setLocalPlayerId: (playerId: string | null) => void;
  setLocalPlayerState: (state: PlayerState | null) => void;
  updateLocalPlayerState: (updates: Partial<PlayerState>) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  updateLastUpdate: () => void;

  // Reset actions
  reset: () => void;
}

export type GameStore = GameState & GameActions;

const initialState: GameState = {
  isConnected: false,
  connectionError: null,
  socketId: null,
  latency: null,
  latencyHistory: [],
  averageLatency: null,
  isLatencyMeasuring: false,
  currentRoom: null,
  availableRooms: [],
  roomPlayers: new Map(),
  roomPlayerCount: 0,
  serverInfo: null,
  localPlayerId: null,
  localPlayerState: null,
  isLoading: false,
  lastUpdate: Date.now(),
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    // Connection actions
    setConnected: (connected: boolean) => set({ isConnected: connected }),
    setConnectionError: (error: string | null) => set({ connectionError: error }),
    setSocketId: (socketId: string | null) => set({ socketId }),

    // Latency actions
    setLatency: (latency: number | null) => set({ latency }),
    setLatencyMeasuring: (measuring: boolean) => set({ isLatencyMeasuring: measuring }),
    
    addLatencyMeasurement: (latency: number) => {
      set((state) => {
        const newHistory = [...state.latencyHistory, latency];
        // Keep only the last MAX_HISTORY measurements
        const maxHistory = GAME_CONSTANTS.LATENCY.MAX_HISTORY;
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        }
        
        // Calculate average
        const averageLatency = newHistory.reduce((sum, val) => sum + val, 0) / newHistory.length;
        
        return {
          latency,
          latencyHistory: newHistory,
          averageLatency,
        };
      });
    },
    
    clearLatencyHistory: () => set({ 
      latency: null, 
      latencyHistory: [], 
      averageLatency: null,
      isLatencyMeasuring: false 
    }),

    // Room actions
    setCurrentRoom: (roomId: string | null) => set({ currentRoom: roomId }),
    setAvailableRooms: (rooms: string[]) => set({ availableRooms: rooms }),

    addRoomPlayer: (playerId: string, playerState: PlayerState) => {
      set((state) => {
        const newRoomPlayers = new Map(state.roomPlayers);
        newRoomPlayers.set(playerId, playerState);
        return { roomPlayers: newRoomPlayers };
      });
    },

    updateRoomPlayer: (playerId: string, playerState: Partial<PlayerState>) => {
      set((state) => {
        const newRoomPlayers = new Map(state.roomPlayers);
        const existingPlayer = newRoomPlayers.get(playerId);
        if (existingPlayer) {
          newRoomPlayers.set(playerId, { ...existingPlayer, ...playerState });
        }
        return { roomPlayers: newRoomPlayers };
      });
    },

    removeRoomPlayer: (playerId: string) => {
      set((state) => {
        const newRoomPlayers = new Map(state.roomPlayers);
        newRoomPlayers.delete(playerId);
        return {
          roomPlayers: newRoomPlayers,
          roomPlayerCount: newRoomPlayers.size
        };
      });
    },

    clearRoomPlayers: () => {
      set({ roomPlayers: new Map(), roomPlayerCount: 0 });
    },

    setRoomPlayerCount: (count: number) => set({ roomPlayerCount: count }),

    // Server actions
    setServerInfo: (info: { connectedClients: number; activeRooms: number }) => {
      set({ serverInfo: info });
    },

    // Local player actions
    setLocalPlayerId: (playerId: string | null) => set({ localPlayerId: playerId }),
    setLocalPlayerState: (state: PlayerState | null) => set({ localPlayerState: state }),

    updateLocalPlayerState: (updates: Partial<PlayerState>) => {
      set((state) => ({
        localPlayerState: state.localPlayerState
          ? { ...state.localPlayerState, ...updates }
          : null
      }));
    },

    // UI actions
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    updateLastUpdate: () => set({ lastUpdate: Date.now() }),

    // Reset action
    reset: () => set(initialState),
  }))
);

// Selectors for commonly used state slices
export const useConnectionState = () => useGameStore((state) => ({
  isConnected: state.isConnected,
  connectionError: state.connectionError,
  socketId: state.socketId,
}));

export const useLatencyState = () => useGameStore((state) => ({
  latency: state.latency,
  latencyHistory: state.latencyHistory,
  averageLatency: state.averageLatency,
  isLatencyMeasuring: state.isLatencyMeasuring,
}));

export const useRoomState = () => useGameStore((state) => ({
  currentRoom: state.currentRoom,
  availableRooms: state.availableRooms,
  roomPlayers: state.roomPlayers,
  roomPlayerCount: state.roomPlayerCount,
}));

export const useLocalPlayerState = () => useGameStore((state) => ({
  localPlayerId: state.localPlayerId,
  localPlayerState: state.localPlayerState,
}));

export const useServerState = () => useGameStore((state) => ({
  serverInfo: state.serverInfo,
  isLoading: state.isLoading,
  lastUpdate: state.lastUpdate,
}));