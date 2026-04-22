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
  Max,
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

  // location ของลูกค้าตอนสั่งอาหาร (required เพื่อตรวจสอบว่าอยู่ในร้าน)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
