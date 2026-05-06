import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { AdminRole } from '../../../generated/prisma';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  restaurant_id!: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
