export const GAME_CONSTANTS = {
  MESSAGES: {
    CONNECTION_SUCCESS: 'Successfully connected to game server',
    ROOM_JOIN_SUCCESS: 'Successfully joined room',
    ROOM_LEAVE_SUCCESS: 'Successfully left room',
    ROOM_NOT_FOUND: 'Room not found',
    PLAYER_NOT_IN_ROOM: 'Player is not in the specified room',
    INVALID_ROOM_DATA: 'Invalid room data provided',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_MOVE_DATA: 'Invalid player move data',
    SERVER_ERROR: 'Internal server error',
    POSITION_SYNC_ERROR: 'Failed to synchronize player position',
  },
  EVENTS: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    PLAYER_JOINED: 'player-joined',
    PLAYER_LEFT: 'player-left',
    PLAYER_MOVED: 'player-moved',
    PLAYER_POSITION: 'player-position',
    POSITION_UPDATE: 'position-update',
    ROOM_JOINED: 'room-joined',
    ROOM_LEFT: 'room-left',
    ERROR: 'error',
    SERVER_INFO: 'server-info',
    CLIENTS_COUNT: 'clients-count',
    PONG: 'pong',
  },
  LIMITS: {
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX: 30, // 30 messages per minute
    // Position update throttling - targeting 20-30 FPS
    POSITION_UPDATE_THROTTLE: 33, // ~30 FPS (33ms between updates)
    POSITION_UPDATE_MAX_PER_SECOND: 30, // Max 30 position updates per second
  },
  NAMESPACE: '/game',
  // Delta compression settings
  DELTA: {
    POSITION_THRESHOLD: 0.1, // Minimum movement in pixels to send update
    ROTATION_THRESHOLD: 0.01, // Minimum rotation change in radians
    VELOCITY_THRESHOLD: 0.05, // Minimum velocity change
  },
} as const;