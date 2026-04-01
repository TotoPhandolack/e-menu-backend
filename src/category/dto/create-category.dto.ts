// category/dto/create-category.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsUUID()
  restaurant_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  sort_order: number;
}
