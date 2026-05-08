import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MoveTableDto } from './dto/move-table.dto';

@UseGuards(JwtAuthGuard)
@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  // ─── Table & Session Management ───────────────────────────────────────────

  /**
   * PATCH /cashier/tables/:id/open
   * Mark a table as OCCUPIED when guests are seated.
   */
  @Patch('tables/:id/open')
  openTable(@Param('id') table_id: string) {
    return this.cashierService.openTable(table_id);
  }

  /**
   * PATCH /cashier/tables/:id/move
   * Transfer all active orders from this table to another.
   */
  @Patch('tables/:id/move')
  moveTable(@Param('id') table_id: string, @Body() dto: MoveTableDto) {
    return this.cashierService.moveTable(table_id, dto);
  }

  /**
   * POST /cashier/tables/:id/clear
   * Close the session: cancel lingering orders, regenerate QR token, set AVAILABLE.
   */
  @Post('tables/:id/clear')
  clearTable(@Param('id') table_id: string) {
    return this.cashierService.clearTable(table_id);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

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
