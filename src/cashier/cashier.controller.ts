// cashier/cashier.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  /**
   * GET /cashier/orders?restaurant_id=<id>
   * Returns SERVED orders ready for payment collection.
   */
  @Get('orders')
  getServedOrders(@Query('restaurant_id') restaurant_id: string) {
    return this.cashierService.getServedOrders(restaurant_id);
  }

  /**
   * PATCH /cashier/orders/:id/pay
   * Marks the given order as PAID.
   */
  @Patch('orders/:id/pay')
  payOrder(@Param('id') order_id: string) {
    return this.cashierService.payOrder(order_id);
  }
}
