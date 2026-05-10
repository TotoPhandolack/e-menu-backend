import { IsEnum, IsUUID } from 'class-validator';

export class ReprintDto {
  @IsUUID()
  order_id: string;

  @IsEnum(['receipt', 'kitchen'])
  type: 'receipt' | 'kitchen';
}
