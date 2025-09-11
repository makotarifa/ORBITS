// Game event types for client-side usage
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface PlayerMoveDto {
  roomId: string;
  position?: Position;
  rotation?: number;
  velocity?: Velocity;
}

export interface PlayerPositionDto {
  roomId: string;
  position: Position;
  rotation: number;
  velocity?: Velocity;
}

export interface PlayerState {
  position: Position;
  rotation: number;
  velocity: Velocity;
  lastUpdate: number;
  roomId?: string;
}

export interface GameRoom {
  id: string;
  players: string[];
  playerStates: Map<string, PlayerState>;
  createdAt: Date;
}

// Server to Client event data types
export interface ConnectedEvent {
  message: string;
  clientId: string;
  timestamp: string;
}

export interface PlayerJoinedEvent {
  playerId: string;
  playerData: any;
  roomId: string;
  timestamp: string;
}

export interface PlayerLeftEvent {
  playerId: string;
  roomId: string;
  timestamp: string;
}

export interface PlayerMovedEvent {
  playerId: string;
  position: Position;
  rotation: number;
  velocity: Velocity;
  timestamp: string;
}

export interface PositionUpdateEvent {
  playerId: string;
  position: Position;
  rotation: number;
  velocity?: Velocity;
  timestamp: string;
}

export interface RoomJoinedEvent {
  roomId: string;
  players: string[];
  playerCount: number;
  playersState?: PlayerState[];
}

export interface RoomLeftEvent {
  roomId: string;
  message: string;
}

export interface ErrorEvent {
  message: string;
  error?: any;
}

export interface ServerInfoEvent {
  connectedClients: number;
  activeRooms: number;
  timestamp: string;
}

export interface ClientsCountEvent {
  count: number;
}

export interface PongEvent {
  timestamp: string;
}

// Client to Server event data types
export interface JoinRoomEvent {
  roomId: string;
}

export interface LeaveRoomEvent {
  roomId: string;
}