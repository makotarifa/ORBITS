import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JwtWsGuard } from '../auth/guards/jwt-ws.guard';
import { JoinRoomDto, LeaveRoomDto, PlayerMoveDto } from './dto/game-events.dto';
import { GAME_CONSTANTS } from './constants/game.constants';
import { APP_CONSTANTS } from '../../constants/app.constants';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || APP_CONSTANTS.CORS.DEFAULT_FRONTEND_URL,
    credentials: true,
  },
  namespace: GAME_CONSTANTS.NAMESPACE,
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger: Logger = new Logger('GameGateway');
  private readonly rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = GAME_CONSTANTS.LIMITS.RATE_LIMIT_WINDOW; // 1 minute
  private readonly RATE_LIMIT_MAX = GAME_CONSTANTS.LIMITS.RATE_LIMIT_MAX; // 30 messages per minute

  constructor(private readonly gameService: GameService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Store client reference
      this.gameService.addClient(client.id, client);

      // Send welcome message
      client.emit(GAME_CONSTANTS.EVENTS.CONNECTED, {
        message: GAME_CONSTANTS.MESSAGES.CONNECTION_SUCCESS,
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });

      // Broadcast updated client count
      this.server.emit(GAME_CONSTANTS.EVENTS.CLIENTS_COUNT, {
        count: this.gameService.getConnectedClientsCount(),
      });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from service
    this.gameService.removeClient(client.id);

    // Broadcast updated client count
    this.server.emit('clients-count', {
      count: this.gameService.getConnectedClientsCount(),
    });
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientLimit = this.rateLimitMap.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      // Reset or create new limit
      this.rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (clientLimit.count >= this.RATE_LIMIT_MAX) {
      return false; // Rate limit exceeded
    }

    clientLimit.count++;
    return true;
  }

  @UseGuards(JwtWsGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!this.checkRateLimit(client.id)) {
        client.emit(GAME_CONSTANTS.EVENTS.ERROR, { message: GAME_CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED });
        return;
      }

      const { roomId } = data;

      this.logger.log(`Client ${client.id} joining room: ${roomId}`);

      // Leave current room if any
      // Note: In a real implementation, you'd track current room per client

      // Join new room
      this.gameService.joinRoom(client.id, roomId);
      client.join(roomId);

      // Notify room members
      this.server.to(roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_JOINED, {
        playerId: client.id,
        playerData: client.data.user,
        roomId,
        timestamp: new Date().toISOString(),
      });

      // Send room info to client
      const roomClients = this.gameService.getRoomClients(roomId);
      client.emit(GAME_CONSTANTS.EVENTS.ROOM_JOINED, {
        roomId,
        players: roomClients,
        playerCount: roomClients.length,
      });

      this.logger.log(`Client ${client.id} successfully joined room ${roomId}`);

    } catch (error) {
      this.logger.error(`Error joining room for client ${client.id}:`, error);
      client.emit(GAME_CONSTANTS.EVENTS.ERROR, {
        message: 'Failed to join room',
        error: error.message,
      });
    }
  }

  @UseGuards(JwtWsGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: LeaveRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!this.checkRateLimit(client.id)) {
        client.emit(GAME_CONSTANTS.EVENTS.ERROR, { message: GAME_CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED });
        return;
      }

      const { roomId } = data;

      this.logger.log(`Client ${client.id} leaving room: ${roomId}`);

      // Leave room
      this.gameService.leaveRoom(client.id, roomId);
      client.leave(roomId);

      // Notify remaining room members
      this.server.to(roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_LEFT, {
        playerId: client.id,
        roomId,
        timestamp: new Date().toISOString(),
      });

      client.emit(GAME_CONSTANTS.EVENTS.ROOM_LEFT, {
        roomId,
        message: GAME_CONSTANTS.MESSAGES.ROOM_LEAVE_SUCCESS,
      });

      this.logger.log(`Client ${client.id} successfully left room ${roomId}`);

    } catch (error) {
      this.logger.error(`Error leaving room for client ${client.id}:`, error);
      client.emit(GAME_CONSTANTS.EVENTS.ERROR, {
        message: 'Failed to leave room',
        error: error.message,
      });
    }
  }

  @UseGuards(JwtWsGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('player-move')
  handlePlayerMove(
    @MessageBody() data: PlayerMoveDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!this.checkRateLimit(client.id)) {
        return; // Silently drop rate limited movement updates
      }

      const { roomId, position, rotation, velocity } = data;

      // Broadcast movement to other players in the room
      client.to(roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_MOVED, {
        playerId: client.id,
        position,
        rotation,
        velocity,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Error handling player move for client ${client.id}:`, error);
    }
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client.id)) {
      return;
    }

    client.emit(GAME_CONSTANTS.EVENTS.PONG, {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('get-server-info')
  handleGetServerInfo(@ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client.id)) {
      client.emit(GAME_CONSTANTS.EVENTS.ERROR, { message: GAME_CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED });
      return;
    }

    client.emit(GAME_CONSTANTS.EVENTS.SERVER_INFO, {
      connectedClients: this.gameService.getConnectedClientsCount(),
      activeRooms: this.gameService.getRoomsCount(),
      timestamp: new Date().toISOString(),
    });
  }
}