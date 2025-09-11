import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword';
      const savedUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        level: 0,
        experience: 0,
        isActive: true,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        username: 'testuser'
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          level: 0,
          experience: 0,
          isActive: true,
          createdAt: savedUser.createdAt,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: 'test@example.com',
        username: 'otheruser',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('El email ya está registrado')
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: 'other@example.com',
        username: 'testuser',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('El nombre de usuario ya está en uso')
      );
    });

    it('should throw ConflictException on database unique constraint violation', async () => {
      const dbError = new Error('Database error');
      (dbError as any).code = '23505';

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue(dbError);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('El usuario ya existe')
      );
    });

    it('should throw BadRequestException on other database errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue(new Error('Other error'));

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('Error al crear el usuario')
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with email', async () => {
      const user = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        level: 5,
        experience: 100,
        isActive: true,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'test@example.com' },
          { username: 'test@example.com' }
        ]
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          level: 5,
          experience: 100,
          isActive: true,
          createdAt: user.createdAt,
        },
      });
    });

    it('should successfully login a user with username', async () => {
      const loginDtoWithUsername = { ...loginDto, emailOrUsername: 'testuser' };
      const user = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        level: 5,
        experience: 100,
        isActive: true,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDtoWithUsername);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'testuser' },
          { username: 'testuser' }
        ]
      });
      expect(result.user.username).toBe('testuser');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas')
      );
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const inactiveUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: false,
      };

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Cuenta desactivada')
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas')
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found and active', async () => {
      const user = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser('user-id');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', isActive: true }
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('user-id');

      expect(result).toBeNull();
    });

    it('should return null if user is not active', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('user-id');

      expect(result).toBeNull();
    });
  });
});