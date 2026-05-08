import { IsUUID } from 'class-validator';

export class MoveTableDto {
  @IsUUID()
  target_table_id: string;
}
