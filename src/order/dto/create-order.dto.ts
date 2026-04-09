// order/dto/create-order.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  menu_item_id!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  special_note?: string;
}

export class CreateOrderDto {
  @IsUUID()
  table_id!: string;

  @IsString()
  @IsNotEmpty()
  session_id!: string;

  @IsArray()
  @ValidateNested({ each: true }) // validate ทุก item ใน array
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
