import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GAME_CONSTANTS } from './constants/game.constants';

interface PlayerPosition {
  x: number;
  y: number;
}

interface PlayerState {
  position: PlayerPosition;
  rotation: number;
  velocity: PlayerPosition;
  lastUpdate: number;
  roomId?: string;
}

interface PlayerClient {
  socket: Socket;
  state: PlayerState;
}

@Injectable()
export class GameService {
  private readonly connectedClients: Map<string, PlayerClient> = new Map();
  private readonly gameRooms: Map<string, Set<string>> = new Map();
  private readonly positionThrottles: Map<string, number> = new Map();

  addClient(clientId: string, socket: Socket) {
    const initialState: PlayerState = {
      position: { x: 0, y: 0 },
      rotation: 0,
      velocity: { x: 0, y: 0 },
      lastUpdate: Date.now(),
    };

    this.connectedClients.set(clientId, {
      socket,
      state: initialState,
    });
  }

  removeClient(clientId: string) {
    const client = this.connectedClients.get(clientId);
    if (client?.state.roomId) {
      this.leaveRoom(clientId, client.state.roomId);
    }

    this.connectedClients.delete(clientId);
    this.positionThrottles.delete(clientId);

    // Remove from all rooms
    this.gameRooms.forEach((clients, roomId) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.gameRooms.delete(roomId);
      }
    });
  }

  joinRoom(clientId: string, roomId: string) {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    // Leave previous room if any
    if (client.state.roomId) {
      this.leaveRoom(clientId, client.state.roomId);
    }

    if (!this.gameRooms.has(roomId)) {
      this.gameRooms.set(roomId, new Set());
    }
    
    this.gameRooms.get(roomId)?.add(clientId);
    client.state.roomId = roomId;
  }

  leaveRoom(clientId: string, roomId: string) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.state.roomId = undefined;
    }

    this.gameRooms.get(roomId)?.delete(clientId);
    if (this.gameRooms.get(roomId)?.size === 0) {
      this.gameRooms.delete(roomId);
    }
  }

  updatePlayerPosition(
    clientId: string,
    position?: PlayerPosition,
    rotation?: number,
    velocity?: PlayerPosition,
  ): { shouldUpdate: boolean; deltaData?: any } {
    const client = this.connectedClients.get(clientId);
    if (!client) {
      return { shouldUpdate: false };
    }

    const now = Date.now();
    const lastThrottle = this.positionThrottles.get(clientId) || 0;

    // Check throttling (33ms = ~30 FPS)
    if (now - lastThrottle < GAME_CONSTANTS.LIMITS.POSITION_UPDATE_THROTTLE) {
      return { shouldUpdate: false };
    }

    const oldState = client.state;
    const deltaData: any = { playerId: clientId };
    let hasSignificantChange = false;

    // Check for significant position change
    if (position && this.hasSignificantPositionChange(oldState.position, position)) {
      deltaData.position = position;
      client.state.position = position;
      hasSignificantChange = true;
    }

    // Check for significant rotation change
    if (rotation !== undefined && Math.abs(oldState.rotation - rotation) > 0.01) {
      deltaData.rotation = rotation;
      client.state.rotation = rotation;
      hasSignificantChange = true;
    }

    // Check for significant velocity change
    if (velocity && this.hasSignificantVelocityChange(oldState.velocity, velocity)) {
      deltaData.velocity = velocity;
      client.state.velocity = velocity;
      hasSignificantChange = true;
    }

    if (hasSignificantChange) {
      client.state.lastUpdate = now;
      this.positionThrottles.set(clientId, now);
      deltaData.timestamp = now;
      return { shouldUpdate: true, deltaData };
    }

    return { shouldUpdate: false };
  }

  private hasSignificantPositionChange(oldPos: PlayerPosition, newPos: PlayerPosition): boolean {
    const threshold = GAME_CONSTANTS.DELTA.POSITION_THRESHOLD; // pixels
    return (
      Math.abs(oldPos.x - newPos.x) > threshold ||
      Math.abs(oldPos.y - newPos.y) > threshold
    );
  }

  private hasSignificantVelocityChange(oldVel: PlayerPosition, newVel: PlayerPosition): boolean {
    const threshold = GAME_CONSTANTS.DELTA.VELOCITY_THRESHOLD;
    return (
      Math.abs(oldVel.x - newVel.x) > threshold ||
      Math.abs(oldVel.y - newVel.y) > threshold
    );
  }

  getPlayerState(clientId: string): PlayerState | undefined {
    return this.connectedClients.get(clientId)?.state;
  }

  getRoomClients(roomId: string): string[] {
    return Array.from(this.gameRooms.get(roomId) || []);
  }

  getRoomPlayersState(roomId: string): Array<{ playerId: string; state: PlayerState }> {
    const clients = this.getRoomClients(roomId);
    return clients
      .map(clientId => {
        const state = this.getPlayerState(clientId);
        return state ? { playerId: clientId, state } : null;
      })
      .filter(Boolean) as Array<{ playerId: string; state: PlayerState }>;
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getRoomsCount(): number {
    return this.gameRooms.size;
  }

  // Method to get client socket for direct communication
  getClientSocket(clientId: string): Socket | undefined {
    return this.connectedClients.get(clientId)?.socket;
  }
}