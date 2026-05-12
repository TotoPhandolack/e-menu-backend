// menu-item/dto/create-menu-item.dto.ts
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  IsOptional,
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

  @IsString()
  @IsOptional()
  imge_url?: string;
}
