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
            getConnectedClientsCount: jest.fn(),
            getRoomsCount: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle connection', async () => {
    const mockClient = {
      id: 'test-client',
      emit: jest.fn(),
      disconnect: jest.fn(),
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
        query: {},
      },
      data: {},
    };

    const mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Mock the server
    (gateway as any).server = mockServer;

    // Mock game service methods
    jest.spyOn(gameService, 'addClient');
    jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(1);

    await gateway.handleConnection(mockClient as any);

    expect(gameService.addClient).toHaveBeenCalledWith('test-client', mockClient);
    expect(mockClient.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CONNECTED, expect.objectContaining({
      message: GAME_CONSTANTS.MESSAGES.CONNECTION_SUCCESS,
      clientId: 'test-client',
    }));
    expect(mockServer.emit).toHaveBeenCalledWith(GAME_CONSTANTS.EVENTS.CLIENTS_COUNT, { count: 1 });
  });

  it('should handle disconnection', async () => {
    const mockClient = {
      id: 'test-client',
    };

    const mockServer = {
      emit: jest.fn(),
    };

    // Mock the server
    (gateway as any).server = mockServer;

    // Mock game service methods
    jest.spyOn(gameService, 'removeClient');
    jest.spyOn(gameService, 'getConnectedClientsCount').mockReturnValue(0);

    await gateway.handleDisconnect(mockClient as any);

    expect(gameService.removeClient).toHaveBeenCalledWith('test-client');
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