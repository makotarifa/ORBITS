import { io, Socket } from 'socket.io-client';
import { GAME_CONSTANTS } from '../../constants/game.constants';
import { tokenService } from '../token/token.service';
import {
  PlayerMoveDto,
  PlayerPositionDto,
  ConnectedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerMovedEvent,
  PositionUpdateEvent,
  RoomJoinedEvent,
  RoomLeftEvent,
  ErrorEvent,
  ServerInfoEvent,
  ClientsCountEvent,
  PongEvent,
  JoinRoomEvent,
  LeaveRoomEvent
} from '../../types/game-events.types';

export interface SocketEvents {
  // Server to Client
  'connected': (data: ConnectedEvent) => void;
  'player-joined': (data: PlayerJoinedEvent) => void;
  'player-left': (data: PlayerLeftEvent) => void;
  'player-moved': (data: PlayerMovedEvent) => void;
  'position-update': (data: PositionUpdateEvent) => void;
  'room-joined': (data: RoomJoinedEvent) => void;
  'room-left': (data: RoomLeftEvent) => void;
  'error': (data: ErrorEvent) => void;
  'server-info': (data: ServerInfoEvent) => void;
  'clients-count': (data: ClientsCountEvent) => void;
  'pong': (data: PongEvent) => void;

  // Client to Server
  'join-room': (data: JoinRoomEvent) => void;
  'leave-room': (data: LeaveRoomEvent) => void;
  'player-move': (data: PlayerMoveDto) => void;
  'player-position': (data: PlayerPositionDto) => void;
  'ping': () => void;
  'get-server-info': () => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = GAME_CONSTANTS.SOCKET.MAX_RECONNECT_ATTEMPTS;
  private readonly reconnectDelay = GAME_CONSTANTS.SOCKET.RECONNECT_DELAY;

  constructor() {
    this.initializeSocket();
  }

  private getAuthToken(): string | null {
    return tokenService.getToken();
  }

  private initializeSocket(): void {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || GAME_CONSTANTS.DEFAULTS.SERVER_URL;

      this.socket = io(`${serverUrl}${GAME_CONSTANTS.NAMESPACE}`, {
        transports: [...GAME_CONSTANTS.SOCKET.TRANSPORTS],
        timeout: GAME_CONSTANTS.SOCKET.TIMEOUT,
        forceNew: GAME_CONSTANTS.SOCKET.FORCE_NEW,
        reconnection: GAME_CONSTANTS.SOCKET.RECONNECTION,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        auth: {
          token: this.getAuthToken(),
        },
      });

      this.setupEventListeners();
      this.setupReconnectionLogic();

    } catch (error) {
      console.error(GAME_CONSTANTS.MESSAGES.FAILED_TO_INITIALIZE_SOCKET, error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on(GAME_CONSTANTS.EVENTS.CONNECT, () => {
      console.log(GAME_CONSTANTS.MESSAGES.CONNECTED_TO_GAME_SERVER, this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.DISCONNECT, (reason: string) => {
      console.log(GAME_CONSTANTS.MESSAGES.DISCONNECTED_FROM_GAME_SERVER, reason);
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.CONNECT_ERROR, (error: Error) => {
      console.error(GAME_CONSTANTS.MESSAGES.CONNECTION_ERROR, error);
      this.handleReconnection();
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT, (attemptNumber: number) => {
      console.log(GAME_CONSTANTS.MESSAGES.RECONNECTED_TO_GAME_SERVER, attemptNumber, GAME_CONSTANTS.MESSAGES.ATTEMPTS);
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT_ERROR, (error: Error) => {
      console.error(GAME_CONSTANTS.MESSAGES.RECONNECTION_ERROR, error);
    });

    this.socket.on(GAME_CONSTANTS.EVENTS.RECONNECT_FAILED, () => {
      console.error(GAME_CONSTANTS.MESSAGES.RECONNECT_FAILED);
    });
  }

  private setupReconnectionLogic(): void {
    if (!this.socket) return;

    this.socket.on(GAME_CONSTANTS.EVENTS.DISCONNECT, () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`${GAME_CONSTANTS.MESSAGES.ATTEMPTING_TO_RECONNECT} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

      setTimeout(() => {
        console.log(`${GAME_CONSTANTS.MESSAGES.RECONNECTING} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    } else {
      console.error(GAME_CONSTANTS.MESSAGES.MAX_RECONNECT_ATTEMPTS_REACHED);
    }
  }

  // Connection management
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error(GAME_CONSTANTS.MESSAGES.SOCKET_NOT_INITIALIZED));
        return;
      }

      if (this.socket.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(GAME_CONSTANTS.MESSAGES.CONNECTION_TIMEOUT));
      }, GAME_CONSTANTS.SOCKET.CONNECTION_TIMEOUT);

      this.socket.once(GAME_CONSTANTS.EVENTS.CONNECT, () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.once(GAME_CONSTANTS.EVENTS.CONNECT_ERROR, (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.connect();
    });
  }

  public connectWithAuth(): Promise<void> {
    // Reinitialize socket with current auth token
    this.disconnect();
    this.initializeSocket();
    return this.connect();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Event emission methods
  public joinRoom(roomId: string): void {
    this.emit('join-room', { roomId });
  }

  public leaveRoom(roomId: string): void {
    this.emit('leave-room', { roomId });
  }

  public sendPlayerMove(data: PlayerMoveDto): void {
    this.emit('player-move', data);
  }

  public sendPlayerPosition(data: PlayerPositionDto): void {
    this.emit('player-position', data);
  }

  public ping(): void {
    this.emit('ping');
  }

  public getServerInfo(): void {
    this.emit('get-server-info');
  }

  // Event listening methods for game events
  public on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    this.socket?.on(event as string, callback as any);
  }

  public off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (callback) {
      this.socket?.off(event as string, callback as any);
    } else {
      this.socket?.off(event as string);
    }
  }

  public once<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    this.socket?.once(event as string, callback as any);
  }

  // Event listening methods for native Socket.io events
  public onNative(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  public offNative(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  public onceNative(event: string, callback: (...args: any[]) => void): void {
    this.socket?.once(event, callback);
  }

  // Generic emit method
  private emit<T extends keyof SocketEvents>(event: T, data?: Parameters<SocketEvents[T]>[0]): void {
    if (!this.socket?.connected) {
      console.warn(GAME_CONSTANTS.MESSAGES.SOCKET_NOT_CONNECTED, event);
      return;
    }

    this.socket.emit(event as string, data);
  }

  // Cleanup
  public removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  public destroy(): void {
    this.removeAllListeners();
    this.disconnect();
  }
}

// Singleton instance
export const socketService = new SocketService();