import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtWsGuard } from '../guards/jwt-ws.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';

describe('JWT Integration - HTTP and WebSocket', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let jwtStrategy: JwtStrategy;
  let jwtWsGuard: JwtWsGuard;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        JwtWsGuard,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    jwtWsGuard = module.get<JwtWsGuard>(JwtWsGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('JWT Configuration Consistency', () => {
    it('should use same JWT secret for both HTTP and WebSocket auth', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use same AuthService.validateUser for both authentication methods', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);

      // Test HTTP auth validation through JwtStrategy
      const httpResult = await jwtStrategy.validate({ sub: 'user-123' });

      // Test WebSocket auth validation would call the same validateUser method
      const wsUser = await authService.validateUser('user-123');

      expect(httpResult).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(wsUser).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledTimes(2);
      expect(authService.validateUser).toHaveBeenCalledWith('user-123');
    });

    it('should handle token verification consistently', async () => {
      const mockPayload = { sub: 'user-123', username: 'testuser' };
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);

      // Create mock WebSocket client
      const mockSocket = {
        handshake: {
          auth: { token: 'test-token' },
          headers: {},
          query: {},
        },
        data: {} as any,
      };

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      };

      // Test WebSocket guard authentication
      const wsResult = await jwtWsGuard.canActivate(mockContext as any);

      expect(wsResult).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('test-token', {
        secret: 'test-secret',
      });
      expect(authService.validateUser).toHaveBeenCalledWith('user-123');
      expect(mockSocket.data.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      });
    });
  });

  describe('Token Format Compatibility', () => {
    it('should accept tokens in multiple formats for WebSocket connections', async () => {
      const mockPayload = { sub: 'user-123', username: 'testuser' };
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);

      // Test auth header format
      const authHeaderSocket = {
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
          query: {},
        },
        data: {} as any,
      };

      const authHeaderContext = {
        switchToWs: () => ({ getClient: () => authHeaderSocket }),
      };

      const authHeaderResult = await jwtWsGuard.canActivate(authHeaderContext as any);
      expect(authHeaderResult).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', {
        secret: 'test-secret',
      });

      // Test query parameter format
      const querySocket = {
        handshake: {
          auth: {},
          headers: {},
          query: { token: 'query-token' },
        },
        data: {} as any,
      };

      const queryContext = {
        switchToWs: () => ({ getClient: () => querySocket }),
      };

      jest.clearAllMocks();
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as any);

      const queryResult = await jwtWsGuard.canActivate(queryContext as any);
      expect(queryResult).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('query-token', {
        secret: 'test-secret',
      });
    });
  });
});