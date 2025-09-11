import { IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class JoinRoomDto {
  @IsString()
  roomId: string;
}

export class LeaveRoomDto {
  @IsString()
  roomId: string;
}

class PositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class VelocityDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class PlayerMoveDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VelocityDto)
  velocity?: VelocityDto;
}

export class PlayerPositionDto {
  @IsString()
  roomId: string;

  @ValidateNested()
  @Type(() => PositionDto)
  position: PositionDto;

  @IsNumber()
  rotation: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VelocityDto)
  velocity?: VelocityDto;
}