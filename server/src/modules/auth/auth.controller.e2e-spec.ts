import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { RegisterDto } from './dto/auth.dto';
import { TEST_CONSTANTS } from './test.constants';

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  validateUser: jest.fn(),
};

// Mock UserRepository
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
              JWT_EXPIRES_IN: '1h',
            }),
          ],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 10000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/register (POST)', () => {
    const registerDto: RegisterDto = {
      username: TEST_CONSTANTS.VALID_USERNAME,
      email: TEST_CONSTANTS.VALID_EMAIL,
      password: TEST_CONSTANTS.VALID_PASSWORD,
    };

    it('should register a new user successfully', () => {
      // Mock successful registration
      mockAuthService.register.mockResolvedValue({
        access_token: TEST_CONSTANTS.ACCESS_TOKEN,
        user: {
          id: 'user-id-123',
          username: TEST_CONSTANTS.VALID_USERNAME,
          email: TEST_CONSTANTS.VALID_EMAIL,
          level: 0,
          experience: 0,
          isActive: true,
          createdAt: new Date(),
        },
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.username).toBe(TEST_CONSTANTS.VALID_USERNAME);
          expect(res.body.user.email).toBe(TEST_CONSTANTS.VALID_EMAIL);
          expect(res.body.user).toHaveProperty('level', 0);
          expect(res.body.user).toHaveProperty('experience', 0);
          expect(res.body.user).toHaveProperty('isActive', true);
          expect(res.body.user).toHaveProperty('createdAt');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should return 409 if email already exists', () => {
      // Mock email conflict error
      mockAuthService.register.mockRejectedValue(
        new HttpException(TEST_CONSTANTS.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT)
      );

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: TEST_CONSTANTS.EXISTING_USERNAME,
          email: TEST_CONSTANTS.VALID_EMAIL,
          password: TEST_CONSTANTS.VALID_PASSWORD,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe(TEST_CONSTANTS.EMAIL_ALREADY_EXISTS);
        });
    });

    it('should return 409 if username already exists', () => {
      // Mock username conflict error
      mockAuthService.register.mockRejectedValue(
        new HttpException(TEST_CONSTANTS.USERNAME_ALREADY_EXISTS, HttpStatus.CONFLICT)
      );

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: TEST_CONSTANTS.VALID_USERNAME,
          email: TEST_CONSTANTS.EXISTING_EMAIL,
          password: TEST_CONSTANTS.VALID_PASSWORD,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe(TEST_CONSTANTS.USERNAME_ALREADY_EXISTS);
        });
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: TEST_CONSTANTS.VALID_USERNAME,
          email: TEST_CONSTANTS.INVALID_EMAIL,
          password: TEST_CONSTANTS.VALID_PASSWORD,
        })
        .expect(400);
    });

    it('should return 400 for password too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: TEST_CONSTANTS.VALID_USERNAME,
          email: TEST_CONSTANTS.VALID_EMAIL,
          password: TEST_CONSTANTS.SHORT_PASSWORD,
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: TEST_CONSTANTS.VALID_USERNAME,
          // missing email and password
        })
        .expect(400);
    });
  });
});