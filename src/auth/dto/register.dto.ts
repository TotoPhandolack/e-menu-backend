import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsUUID,
  MinLength,
} from 'class-validator';

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
}
