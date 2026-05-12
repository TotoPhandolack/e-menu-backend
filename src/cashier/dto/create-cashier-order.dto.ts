import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CashierOrderItemDto {
  @IsUUID()
  menu_item_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  special_note?: string;
}

export class CreateCashierOrderDto {
  @IsEnum(['TABLE', 'TAKEAWAY'])
  order_type!: 'TABLE' | 'TAKEAWAY';

  @IsOptional()
  @IsUUID()
  table_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CashierOrderItemDto)
  items!: CashierOrderItemDto[];
}
