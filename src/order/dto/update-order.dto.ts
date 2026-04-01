export class UpdateOrderStatusDto {
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'SERVED'
    | 'PAID'
    | 'CANCELLED';
}
