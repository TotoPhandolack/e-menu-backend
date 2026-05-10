import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class SplitItemDto {
  @IsString()
  label: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  item_ids: string[];
}

export class SplitBillDto {
  @IsEnum(['equal', 'by_item'])
  mode: 'equal' | 'by_item';

  @ValidateIf((o) => o.mode === 'equal')
  @IsInt()
  @Min(2)
  number_of_people?: number;

  @ValidateIf((o) => o.mode === 'by_item')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  splits?: SplitItemDto[];
}
