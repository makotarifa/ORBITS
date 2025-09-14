import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { GAME_CONSTANTS } from './constants/game.constants';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let gameService: GameService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: GameService,
          useValue: {
            addClient: jest.fn(),
            removeClient: jest.fn(),
            joinRoom: jest.fn(),
            leaveRoom: jest.fn(),
            getRoomClients: jest.fn(),
            getRoomPlayersState: jest.fn(),
            getConnectedClientsCount: jest.fn(),
            getRoomsCount: jest.fn(),
            getPlayerState: jest.fn(),
            updatePlayerPosition: jest.fn(),
            getClientSocket: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    gameService = module.get<GameService>(GameService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should handle authenticated connection successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const mockClient = {
        id: 'test-client',
        emit: jest.fn(),
        disconnect: jest.fn(),
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
          query: {},
        },
        data: {} as any,
      };

      const mockServer = {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      };

      // Mock the server
      (gateway as any).server = mockServer;

      // Mock authentication services
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123', username: 'testuser' });
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);

      // Mock game service methods
      jest.spyOn(gameService, 'addClient');
      jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(1);

      await gateway.handleConnection(mockClient as any);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'test-secret' });
      expect(authService.validateUser).toHaveBeenCalledWith('user-123');
      expect(mockClient.data.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(gameService.addClient).toHaveBeenCalledWith('test-client', mockClient);
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CONNECTED, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.CONNECTION_SUCCESS,
        clientId: 'test-client',
        user: mockUser,
      }));
      expect(mockServer.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CLIENTS_COUNT, { count: 1 });
    });

    it('should handle disconnection', async () => {
      const mockClient = {
        id: 'test-client',
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      const mockServer = {
        emit: jest.fn(),
      };

      // Mock the server
      (gateway as any).server = mockServer;

      // Mock game service methods
      const mockPlayerState = { roomId: 'room1', position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, lastUpdate: Date.now() };
      jest.spyOn(gameService, 'getPlayerState').mockReturnValue(mockPlayerState);
      jest.spyOn(gameService, 'removeClient');
      jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(0);

      await gateway.handleDisconnect(mockClient as any);

      expect(gameService.removeClient).toHaveBeenCalledWith('test-client');
      expect(mockClient.to).toHaveBeenCalledWith('room1');
      expect(mockServer.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CLIENTS_COUNT, { count: 0 });
    });

    it('should handle get server info', async () => {
      const mockClient = {
        id: 'test-client',
        emit: jest.fn(),
      };

      const mockServer = {
        emit: jest.fn(),
      };

      // Mock the server
      (gateway as any).server = mockServer;

      // Mock game service methods
      jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(5);
      jest.spyOn(gameService, 'getRoomsCount').mockReturnValue(2);

      // Mock rate limit check
      jest.spyOn(gateway as any, 'checkRateLimit').mockReturnValue(true);

      gateway.handleGetServerInfo(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.SERVER_INFO, expect.objectContaining({
        connectedClients: 5,
        activeRooms: 2,
      }));
    });
  });

  describe('Position synchronization', () => {
    let mockClient: any;
    let mockServer: any;

    beforeEach(() => {
      mockClient = {
        id: 'test-client',
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        join: jest.fn(),
        leave: jest.fn(),
        data: { user: { id: 'user1' } },
      };

      mockServer = {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      };

      (gateway as any).server = mockServer;
    });

    it('should handle player move with delta compression', () => {
      const moveData = {
        roomId: 'room1',
        position: { x: 10, y: 20 },
        rotation: 1.5,
        velocity: { x: 5, y: 10 },
      };

      const mockUpdateResult = {
        shouldUpdate: true,
        deltaData: {
          playerId: 'test-client',
          position: { x: 10, y: 20 },
          rotation: 1.5,
          timestamp: Date.now(),
        },
      };

      // Mock position rate limit check
      jest.spyOn(gateway as any, 'checkPositionRateLimit').mockReturnValue(true);
      jest.spyOn(gameService, 'updatePlayerPosition').mockReturnValue(mockUpdateResult);

      gateway.handlePlayerMove(moveData, mockClient);

      expect(gameService.updatePlayerPosition).toHaveBeenCalledWith(
        'test-client',
        moveData.position,
        moveData.rotation,
        moveData.velocity,
      );
      expect(mockClient.to).toHaveBeenCalledWith('room1');
    });

    it('should handle player position updates', () => {
      const positionData = {
        roomId: 'room1',
        position: { x: 15, y: 25 },
        rotation: 2.0,
        velocity: { x: 8, y: 12 },
      };

      const mockUpdateResult = {
        shouldUpdate: true,
        deltaData: {
          playerId: 'test-client',
          position: { x: 15, y: 25 },
          rotation: 2.0,
          timestamp: Date.now(),
        },
      };

      // Mock position rate limit check
      jest.spyOn(gateway as any, 'checkPositionRateLimit').mockReturnValue(true);
      jest.spyOn(gameService, 'updatePlayerPosition').mockReturnValue(mockUpdateResult);

      gateway.handlePlayerPosition(positionData, mockClient);

      expect(gameService.updatePlayerPosition).toHaveBeenCalledWith(
        'test-client',
        positionData.position,
        positionData.rotation,
        positionData.velocity,
      );
      expect(mockClient.to).toHaveBeenCalledWith('room1');
    });

    it('should not broadcast when no significant change detected', () => {
      const moveData = {
        roomId: 'room1',
        position: { x: 10.01, y: 20.01 },
        rotation: 1.5001,
      };

      const mockUpdateResult = {
        shouldUpdate: false,
      };

      // Mock position rate limit check
      jest.spyOn(gateway as any, 'checkPositionRateLimit').mockReturnValue(true);
      jest.spyOn(gameService, 'updatePlayerPosition').mockReturnValue(mockUpdateResult);

      gateway.handlePlayerMove(moveData, mockClient);

      expect(gameService.updatePlayerPosition).toHaveBeenCalled();
      expect(mockClient.to).not.toHaveBeenCalled();
    });

    it('should respect position rate limiting', () => {
      const moveData = {
        roomId: 'room1',
        position: { x: 10, y: 20 },
      };

      // Mock rate limit exceeded
      jest.spyOn(gateway as any, 'checkPositionRateLimit').mockReturnValue(false);
      jest.spyOn(gameService, 'updatePlayerPosition');

      gateway.handlePlayerMove(moveData, mockClient);

      expect(gameService.updatePlayerPosition).not.toHaveBeenCalled();
    });

    it('should handle join room with existing players state', () => {
      const joinData = { roomId: 'room1' };
      const mockRoomClients = ['client1', 'client2'];
      const mockPlayersState = [
        { playerId: 'client1', state: { position: { x: 10, y: 10 }, rotation: 0, velocity: { x: 0, y: 0 }, lastUpdate: Date.now() } },
        { playerId: 'client2', state: { position: { x: 20, y: 20 }, rotation: 1, velocity: { x: 5, y: 5 }, lastUpdate: Date.now() } },
      ];

      // Mock rate limit check
      jest.spyOn(gateway as any, 'checkRateLimit').mockReturnValue(true);
      jest.spyOn(gameService, 'joinRoom');
      jest.spyOn(gameService, 'getRoomClients').mockReturnValue(mockRoomClients);
      jest.spyOn(gameService, 'getRoomPlayersState').mockReturnValue(mockPlayersState);

      gateway.handleJoinRoom(joinData, mockClient);

      expect(gameService.joinRoom).toHaveBeenCalledWith('test-client', 'room1');
      expect(mockClient.join).toHaveBeenCalledWith('room1');
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.ROOM_JOINED, expect.objectContaining({
        roomId: 'room1',
        players: mockRoomClients,
        playerCount: 2,
        playersState: mockPlayersState,
      }));
    });
  });

  describe('Rate limiting', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        id: 'test-client',
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      };
    });

    it('should implement position-specific rate limiting', () => {
      const gateway_private = gateway as any;

      // First call should pass
      expect(gateway_private.checkPositionRateLimit('client1')).toBe(true);

      // Simulate rapid calls
      for (let i = 0; i < 35; i++) {
        gateway_private.checkPositionRateLimit('client1');
      }

      // Should be rate limited
      expect(gateway_private.checkPositionRateLimit('client1')).toBe(false);
    });

    it('should handle general rate limiting', () => {
      const gateway_private = gateway as any;

      // First call should pass
      expect(gateway_private.checkRateLimit('client1')).toBe(true);

      // Simulate rapid calls
      for (let i = 0; i < 35; i++) {
        gateway_private.checkRateLimit('client1');
      }

      // Should be rate limited
      expect(gateway_private.checkRateLimit('client1')).toBe(false);
    });
  });

  describe('WebSocket Authentication', () => {
    let mockClient: any;
    let mockServer: any;

    beforeEach(() => {
      mockClient = {
        id: 'test-client',
        emit: jest.fn(),
        disconnect: jest.fn(),
        handshake: {
          auth: {},
          headers: {},
          query: {},
        },
        data: {} as any,
      };

      mockServer = {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      };

      (gateway as any).server = mockServer;
    });

    it('should reject connection with no token', async () => {
      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.ERROR, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.AUTHENTICATION_FAILED,
        error: 'No authentication token provided',
      }));
      
      // Client should be disconnected after timeout
      setTimeout(() => {
        expect(mockClient.disconnect).toHaveBeenCalled();
      }, 150);
    });

    it('should reject connection with invalid token', async () => {
      mockClient.handshake.auth.token = 'invalid-token';
      
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');

      await gateway.handleConnection(mockClient);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', { secret: 'test-secret' });
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.ERROR, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.AUTHENTICATION_FAILED,
        error: 'Invalid or expired token',
      }));
      
      setTimeout(() => {
        expect(mockClient.disconnect).toHaveBeenCalled();
      }, 150);
    });

    it('should reject connection when user not found', async () => {
      mockClient.handshake.auth.token = 'valid-token';
      
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123' });
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await gateway.handleConnection(mockClient);

      expect(authService.validateUser).toHaveBeenCalledWith('user-123');
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.ERROR, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.AUTHENTICATION_FAILED,
        error: 'User not found or inactive',
      }));
      
      setTimeout(() => {
        expect(mockClient.disconnect).toHaveBeenCalled();
      }, 150);
    });

    it('should extract token from authorization header', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockClient.handshake.headers.authorization = 'Bearer header-token';
      
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123', username: 'testuser' });
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(gameService, 'addClient');
      jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(1);

      await gateway.handleConnection(mockClient);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', { secret: 'test-secret' });
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CONNECTED, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.CONNECTION_SUCCESS,
        user: mockUser,
      }));
    });

    it('should extract token from query parameter', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockClient.handshake.query.token = 'query-token';
      
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123', username: 'testuser' });
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(gameService, 'addClient');
      jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(1);

      await gateway.handleConnection(mockClient);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('query-token', { secret: 'test-secret' });
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CONNECTED, expect.objectContaining({
        message: GAME_CONSTANTS.MESSAGES.CONNECTION_SUCCESS,
        user: mockUser,
      }));
    });
  });

  describe('Error handling', () => {
    it('should handle position sync errors gracefully', () => {
      const mockClient = {
        id: 'test-client',
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      } as any;

      const moveData = {
        roomId: 'room1',
        position: { x: 10, y: 20 },
      };

      // Mock position rate limit check
      jest.spyOn(gateway as any, 'checkPositionRateLimit').mockReturnValue(true);
      jest.spyOn(gameService, 'updatePlayerPosition').mockImplementation(() => {
        throw new Error('Position update failed');
      });

      // Should not throw
      expect(() => gateway.handlePlayerMove(moveData, mockClient)).not.toThrow();
      expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.ERROR, {
        message: GAME_CONSTANTS.MESSAGES.POSITION_SYNC_ERROR,
      });
    });
  });
});