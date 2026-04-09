// restaurant/dto/create-restaurant.dto.ts
import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @Min(10)
  radius_meters!: number;
}
