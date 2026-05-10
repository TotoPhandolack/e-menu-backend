import { IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma';

export class ProcessPaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
