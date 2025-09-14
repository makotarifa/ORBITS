// Socket-related hooks
export { useSocket } from './useSocket';
export { useGameEvents } from './useGameEvents';
export { usePlayer } from './usePlayer';
export { useConnectionState as useSocketConnectionState } from './useConnectionState';

// Re-export types for convenience
export type { UseSocketReturn } from './useSocket';
export type { UseGameEventsReturn } from './useGameEvents';
export type { UsePlayerReturn, PlayerState } from './usePlayer';