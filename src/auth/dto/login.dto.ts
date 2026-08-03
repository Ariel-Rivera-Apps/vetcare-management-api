import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'receptionist@vetcare.local',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'configured-through-environment',
    minLength: 1,
    maxLength: 256,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}
