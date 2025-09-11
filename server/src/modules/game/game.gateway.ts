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
import { JoinRoomDto, LeaveRoomDto, PlayerMoveDto, PlayerPositionDto } from './dto/game-events.dto';
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
  private readonly positionRateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = GAME_CONSTANTS.LIMITS.RATE_LIMIT_WINDOW; // 1 minute
  private readonly RATE_LIMIT_MAX = GAME_CONSTANTS.LIMITS.RATE_LIMIT_MAX; // 30 messages per minute
  private readonly POSITION_RATE_LIMIT_WINDOW = GAME_CONSTANTS.LIMITS.POSITION_RATE_LIMIT_WINDOW; // 1 second
  private readonly POSITION_RATE_LIMIT_MAX = GAME_CONSTANTS.LIMITS.POSITION_UPDATE_MAX_PER_SECOND;

  constructor(private readonly gameService: GameService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Store client reference with initial state
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

    // Get player state before removal for cleanup
    const playerState = this.gameService.getPlayerState(client.id);
    
    // Remove client from service (handles room cleanup)
    this.gameService.removeClient(client.id);

    // Clean up rate limiting maps
    this.rateLimitMap.delete(client.id);
    this.positionRateLimitMap.delete(client.id);

    // If player was in a room, notify other players
    if (playerState?.roomId) {
      client.to(playerState.roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_LEFT, {
        playerId: client.id,
        roomId: playerState.roomId,
        timestamp: new Date().toISOString(),
      });
    }

    // Broadcast updated client count
    this.server.emit(GAME_CONSTANTS.EVENTS.CLIENTS_COUNT, {
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

  private checkPositionRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientLimit = this.positionRateLimitMap.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      // Reset or create new limit
      this.positionRateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + this.POSITION_RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (clientLimit.count >= this.POSITION_RATE_LIMIT_MAX) {
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

      // Join new room (service handles leaving previous room)
      this.gameService.joinRoom(client.id, roomId);
      client.join(roomId);

      // Get current room state for new player
      const roomPlayersState = this.gameService.getRoomPlayersState(roomId);

      // Notify room members about new player
      this.server.to(roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_JOINED, {
        playerId: client.id,
        playerData: client.data.user,
        roomId,
        timestamp: new Date().toISOString(),
      });

      // Send room info and current players' positions to the new client
      const roomClients = this.gameService.getRoomClients(roomId);
      client.emit(GAME_CONSTANTS.EVENTS.ROOM_JOINED, {
        roomId,
        players: roomClients,
        playerCount: roomClients.length,
        playersState: roomPlayersState.filter(p => p.playerId !== client.id), // Exclude self
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
      // Use dedicated position rate limiting
      if (!this.checkPositionRateLimit(client.id)) {
        return; // Silently drop rate limited movement updates
      }

      const { roomId, position, rotation, velocity } = data;

      // Update player position with delta compression
      const updateResult = this.gameService.updatePlayerPosition(
        client.id,
        position,
        rotation,
        velocity,
      );

      // Only broadcast if there's a significant change
      if (updateResult.shouldUpdate && updateResult.deltaData) {
        // Broadcast movement to other players in the room
        client.to(roomId).emit(GAME_CONSTANTS.EVENTS.PLAYER_MOVED, updateResult.deltaData);
      }

    } catch (error) {
      this.logger.error(`Error handling player move for client ${client.id}:`, error);
      client.emit(GAME_CONSTANTS.EVENTS.ERROR, {
        message: GAME_CONSTANTS.MESSAGES.POSITION_SYNC_ERROR,
      });
    }
  }

  @UseGuards(JwtWsGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('player-position')
  handlePlayerPosition(
    @MessageBody() data: PlayerPositionDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Use dedicated position rate limiting
      if (!this.checkPositionRateLimit(client.id)) {
        return; // Silently drop rate limited position updates
      }

      const { roomId, position, rotation, velocity } = data;

      // Update player position with delta compression
      const updateResult = this.gameService.updatePlayerPosition(
        client.id,
        position,
        rotation,
        velocity,
      );

      // Only broadcast if there's a significant change
      if (updateResult.shouldUpdate && updateResult.deltaData) {
        // Broadcast position update to other players in the room
        client.to(roomId).emit(GAME_CONSTANTS.EVENTS.POSITION_UPDATE, updateResult.deltaData);
      }

    } catch (error) {
      this.logger.error(`Error handling player position for client ${client.id}:`, error);
      client.emit(GAME_CONSTANTS.EVENTS.ERROR, {
        message: GAME_CONSTANTS.MESSAGES.POSITION_SYNC_ERROR,
      });
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