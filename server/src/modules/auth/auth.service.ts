import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { TEST_CONSTANTS } from './test.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException(TEST_CONSTANTS.EMAIL_ALREADY_EXISTS);
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new ConflictException(TEST_CONSTANTS.USERNAME_ALREADY_EXISTS);
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = this.userRepository.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      isActive: true,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Generate JWT token
      const payload = { sub: savedUser.id, username: savedUser.username };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          level: savedUser.level,
          experience: savedUser.experience,
          isActive: savedUser.isActive,
          createdAt: savedUser.createdAt,
        },
      };
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        throw new ConflictException(TEST_CONSTANTS.USER_ALREADY_EXISTS);
      }
      throw new BadRequestException(TEST_CONSTANTS.ERROR_CREATING_USER);
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrUsername, password } = loginDto;

    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      throw new UnauthorizedException(TEST_CONSTANTS.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(TEST_CONSTANTS.ACCOUNT_DEACTIVATED);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(TEST_CONSTANTS.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate JWT token
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        experience: user.experience,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });
  }
}