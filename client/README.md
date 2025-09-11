# Orbits Multiplayer Game - Client

A real-time multiplayer game client built with React, Phaser.js, and Socket.io.

## Features

- **Real-time Multiplayer**: Connect to game rooms and see other players move in real-time
- **Smooth Movement**: Client-side prediction and server reconciliation for responsive gameplay
- **Position Interpolation**: Smooth interpolation of remote player positions to reduce jitter
- **React Integration**: Modern React hooks for state management and socket communication
- **Phaser.js Rendering**: High-performance 2D game rendering with camera controls
- **TypeScript**: Full type safety throughout the application
- **Zustand State Management**: Lightweight and efficient global state management

## Architecture

### Core Components

1. **Socket Service** (`src/services/socket/socket.service.ts`)
   - Manages WebSocket connection to the game server
   - Handles reconnection logic and error recovery
   - Provides typed event emission and listening

2. **React Hooks** (`src/hooks/socket/`)
   - `useSocket`: Connection management and status
   - `useGameEvents`: Game event handling (player joined/left/moved)
   - `usePlayer`: Local player state and room management

3. **Game Store** (`src/stores/game.store.ts`)
   - Global state management with Zustand
   - Player states, room information, connection status
   - Reactive updates for UI components

4. **Phaser Entities** (`src/game/entities/`)
   - `LocalPlayerEntity`: Handles local player input and movement
   - `RemotePlayerEntity`: Manages remote players with position interpolation
   - `BasePlayerEntity`: Common functionality for all player entities

5. **Game Scene** (`src/game/scenes/GameScene.ts`)
   - Main Phaser scene coordinating all game elements
   - Integrates socket events with Phaser entities
   - Manages camera, UI, and game state

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running Orbits game server

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the client directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

## Usage

### Connecting to a Game

1. The client automatically attempts to connect to the server on startup
2. Once connected, it joins the default "main-room"
3. Use WASD or arrow keys to move your player
4. See other players move in real-time with smooth interpolation

### Game Controls

- **WASD** or **Arrow Keys**: Move player
- **Mouse**: Camera follows local player automatically

### Development

#### Project Structure

```
client/
├── src/
│   ├── components/     # React UI components
│   ├── game/
│   │   ├── entities/   # Phaser game entities
│   │   └── scenes/     # Phaser game scenes
│   ├── hooks/
│   │   └── socket/     # Socket-related React hooks
│   ├── services/
│   │   └── socket/     # Socket.io client service
│   ├── stores/         # Zustand state stores
│   ├── types/          # TypeScript type definitions
│   ├── constants/      # Game constants
│   └── utils/          # Utility functions
├── public/
└── package.json
```

#### Key Files

- `src/services/socket/socket.service.ts`: Socket connection management
- `src/hooks/socket/index.ts`: React hooks for socket integration
- `src/stores/game.store.ts`: Global game state
- `src/game/entities/`: Player entities with interpolation
- `src/game/scenes/GameScene.ts`: Main game scene

## API Reference

### Socket Events

#### Client to Server
- `join-room`: Join a game room
- `leave-room`: Leave current room
- `player-move`: Send movement command
- `player-position`: Send position update

#### Server to Client
- `connected`: Connection established
- `player-joined`: New player joined room
- `player-left`: Player left room
- `player-moved`: Player movement update
- `position-update`: Position synchronization
- `room-joined`: Successfully joined room
- `room-left`: Left room
- `error`: Error occurred

### React Hooks

#### useSocket()
```typescript
const { isConnected, socketId, error, connect, disconnect } = useSocket();
```

#### useGameEvents()
```typescript
const { onPlayerJoined, onPlayerLeft, onPlayerMoved } = useGameEvents();
```

#### usePlayer()
```typescript
const { player, joinRoom, updatePosition, sendMove } = usePlayer();
```

### Game Store

```typescript
import { useGameStore } from './stores';

// Get state
const state = useGameStore.getState();

// Subscribe to changes
const unsubscribe = useGameStore.subscribe((state) => {
  console.log('Game state changed:', state);
});
```

## Performance Optimizations

- **Position Throttling**: Position updates are throttled to 30 FPS to reduce network traffic
- **Interpolation**: Remote player positions are interpolated for smooth movement
- **Delta Compression**: Only significant position changes are sent to server
- **Efficient Rendering**: Phaser.js optimized rendering with object pooling

## Troubleshooting

### Connection Issues

1. Ensure the game server is running on the correct port
2. Check that `VITE_SERVER_URL` environment variable is set correctly
3. Verify network connectivity and firewall settings

### Performance Issues

1. Reduce position update frequency in `GAME_CONSTANTS.LIMITS.POSITION_UPDATE_THROTTLE`
2. Adjust interpolation speed in `RemotePlayerEntity.interpolationSpeed`
3. Monitor network latency and adjust timeout values

### Build Issues

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check TypeScript compilation: `npm run build`
3. Verify all dependencies are compatible

## Contributing

1. Follow the existing code style and architecture patterns
2. Add TypeScript types for new features
3. Write tests for new functionality
4. Update documentation for API changes

## License

This project is part of the Orbits multiplayer game system.