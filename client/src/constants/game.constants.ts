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
    // Socket related messages
    SOCKET_NOT_CONNECTED: 'Socket not connected, cannot emit event:',
    CONNECTION_TIMEOUT: 'Connection timeout',
    SOCKET_NOT_INITIALIZED: 'Socket not initialized',
    MAX_RECONNECT_ATTEMPTS_REACHED: 'Max reconnection attempts reached',
    CONNECTED_TO_GAME_SERVER: 'Connected to game server:',
    DISCONNECTED_FROM_GAME_SERVER: 'Disconnected from game server:',
    CONNECTION_ERROR: 'Connection error:',
    RECONNECTED_TO_GAME_SERVER: 'Reconnected to game server after',
    RECONNECTION_ERROR: 'Reconnection error:',
    FAILED_TO_RECONNECT: 'Failed to reconnect to game server',
    ATTEMPTING_TO_RECONNECT: 'Attempting to reconnect',
    RECONNECTING: 'Reconnecting...',
    FAILED_TO_INITIALIZE_SOCKET: 'Failed to initialize socket:',
    ATTEMPTS: 'attempts',
    RECONNECT_FAILED: 'Failed to reconnect to game server',
  },
  UI: {
    LABELS: {
      ROOM_ID: 'Room ID',
      GAME_CONTROLS: 'Game Controls',
      INSTRUCTIONS: 'Instructions',
      CONTROLS: 'Controls',
      CONNECTED_TO: 'Connected to:',
    },
    PLACEHOLDERS: {
      ENTER_ROOM_ID: 'Enter room ID',
    },
    BUTTONS: {
      JOIN_ROOM: 'Join Room',
      LEAVE_ROOM: 'Leave Room',
    },
    INSTRUCTIONS: {
      MOVE_KEYS: 'WASD or Arrow Keys: Move',
      CAMERA_FOLLOW: 'Camera follows your player',
      JOIN_ROOMS: 'Join rooms to play with others',
      REAL_TIME_POSITIONS: 'See real-time player positions',
      USE_MOVE_KEYS: 'Use WASD or Arrow Keys to move',
      CAMERA_AUTO_FOLLOW: 'Camera automatically follows you',
    },
    STATUS: {
      CONNECTING: 'Connecting...',
      CONNECTED: 'Connected',
      DISCONNECTED: 'Disconnected',
      PLAYERS_COUNT: 'Players:',
      ROOM: 'Room:',
      NONE: 'None',
    },
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
    // Socket.io native events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    RECONNECT_ERROR: 'reconnect_error',
    RECONNECT_FAILED: 'reconnect_failed',
  },
  LIMITS: {
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX: 30, // 30 messages per minute
    // Position update throttling - targeting 20-30 FPS
    POSITION_UPDATE_THROTTLE: 33, // ~30 FPS (33ms between updates)
    POSITION_UPDATE_MAX_PER_SECOND: 30, // Max 30 position updates per second
  },
  NAMESPACE: '/game',
  // Socket configuration
  SOCKET: {
    TRANSPORTS: ['websocket', 'polling'],
    TIMEOUT: 5000,
    CONNECTION_TIMEOUT: 10000,
    FORCE_NEW: true,
    RECONNECTION: true,
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
  },
  // Default values
  DEFAULTS: {
    SERVER_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3000',
    ROOM_ID: 'main-room',
    PLAYER_POSITION: { x: 400, y: 300 },
    GAME_WORLD: {
      WIDTH: 800,
      HEIGHT: 600,
    },
    MOVEMENT_BOUNDS: {
      MIN_X: 0,
      MAX_X: 800,
      MIN_Y: 0,
      MAX_Y: 600,
    },
  },
  // Delta compression settings
  DELTA: {
    POSITION_THRESHOLD: 0.1, // Minimum movement in pixels to send update
    ROTATION_THRESHOLD: 0.01, // Minimum rotation change in radians
    VELOCITY_THRESHOLD: 0.05, // Minimum velocity change
  },
} as const;