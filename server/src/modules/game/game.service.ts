import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
  private readonly connectedClients: Map<string, any> = new Map();
  private readonly gameRooms: Map<string, Set<string>> = new Map();

  addClient(clientId: string, client: any) {
    this.connectedClients.set(clientId, client);
  }

  removeClient(clientId: string) {
    this.connectedClients.delete(clientId);

    // Remove from all rooms
    this.gameRooms.forEach((clients, roomId) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.gameRooms.delete(roomId);
      }
    });
  }

  joinRoom(clientId: string, roomId: string) {
    if (!this.gameRooms.has(roomId)) {
      this.gameRooms.set(roomId, new Set());
    }
    this.gameRooms.get(roomId)?.add(clientId);
  }

  leaveRoom(clientId: string, roomId: string) {
    this.gameRooms.get(roomId)?.delete(clientId);
    if (this.gameRooms.get(roomId)?.size === 0) {
      this.gameRooms.delete(roomId);
    }
  }

  getRoomClients(roomId: string): string[] {
    return Array.from(this.gameRooms.get(roomId) || []);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getRoomsCount(): number {
    return this.gameRooms.size;
  }
}