import { IsString, IsOptional } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  roomId: string;
}

export class LeaveRoomDto {
  @IsString()
  roomId: string;
}

export class PlayerMoveDto {
  @IsString()
  roomId: string;

  @IsOptional()
  position?: { x: number; y: number };

  @IsOptional()
  rotation?: number;

  @IsOptional()
  velocity?: { x: number; y: number };
}