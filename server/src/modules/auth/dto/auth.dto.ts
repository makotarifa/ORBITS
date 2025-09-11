import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre de usuario no puede tener más de 50 caracteres' })
  @Matches(/^\w+$/, {
    message: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
  })
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255, { message: 'El email no puede tener más de 255 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede tener más de 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'
  })
  password: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El email o nombre de usuario es requerido' })
  @Transform(({ value }) => value?.trim())
  emailOrUsername: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    experience: number;
    isActive: boolean;
    createdAt: Date;
  };
}