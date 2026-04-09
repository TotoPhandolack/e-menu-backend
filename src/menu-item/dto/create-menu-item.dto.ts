// menu-item/dto/create-menu-item.dto.ts
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  restaurant_id!: string;

  @IsUUID()
  category_id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
