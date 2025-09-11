import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to socket for later use
      client.data.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      return true;
    } catch (error) {
      console.error('WebSocket authentication error:', error.message);
      return false;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    try {
      // Try to get token from handshake auth
      const token = client.handshake.auth?.token ||
                   client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   client.handshake.query?.token;

      return token || null;
    } catch (error) {
      console.error('Error extracting token from socket:', error);
      return null;
    }
  }
}