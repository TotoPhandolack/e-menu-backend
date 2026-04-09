// table/dto/create-table.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateTableDto {
  @IsUUID()
  restaurant_id!: string;

  @IsString()
  @IsNotEmpty()
  table_number!: string;

  @IsNumber()
  @Min(1)
  capacity!: number;
}
