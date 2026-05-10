import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MoveTableDto } from './dto/move-table.dto';
import { CreateCashierOrderDto } from './dto/create-cashier-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  // ─── Table & Session Management ───────────────────────────────────────────

  @Patch('tables/:id/open')
  openTable(@Param('id') table_id: string) {
    return this.cashierService.openTable(table_id);
  }

  @Patch('tables/:id/move')
  moveTable(@Param('id') table_id: string, @Body() dto: MoveTableDto) {
    return this.cashierService.moveTable(table_id, dto);
  }

  @Post('tables/:id/clear')
  clearTable(@Param('id') table_id: string) {
    return this.cashierService.clearTable(table_id);
  }

  // ─── Order Management ─────────────────────────────────────────────────────

  /**
   * POST /cashier/orders
   * Cashier creates a TABLE or TAKEAWAY order manually.
   * restaurant_id is taken from the JWT token — no need to send it in the body.
   */
  @Post('orders')
  createOrder(@Body() dto: CreateCashierOrderDto, @Request() req: { user: { restaurant_id: string } }) {
    return this.cashierService.createCashierOrder(dto, req.user.restaurant_id);
  }

  /**
   * GET /cashier/orders/live
   * Real-time dashboard — all active orders for the cashier's restaurant.
   */
  @Get('orders/live')
  getLiveOrders(@Request() req: { user: { restaurant_id: string } }) {
    return this.cashierService.getLiveOrders(req.user.restaurant_id);
  }

  /**
   * POST /cashier/orders/:id/items
   * Add one or more items to an existing in-progress order.
   */
  @Post('orders/:id/items')
  addOrderItems(
    @Param('id') order_id: string,
    @Body() dto: AddOrderItemsDto,
    @Request() req,
  ) {
    return this.cashierService.addOrderItems(order_id, dto, req.user.restaurant_id);
  }

  /**
   * PATCH /cashier/orders/:id/items/:itemId
   * Edit quantity or special note on a single order item.
   */
  @Patch('orders/:id/items/:itemId')
  updateOrderItem(
    @Param('id') order_id: string,
    @Param('itemId') item_id: string,
    @Body() dto: UpdateOrderItemDto,
    @Request() req,
  ) {
    return this.cashierService.updateOrderItem(order_id, item_id, dto, req.user.restaurant_id);
  }

  /**
   * DELETE /cashier/orders/:id/items/:itemId
   * Remove a single item from an active order.
   */
  @Delete('orders/:id/items/:itemId')
  removeOrderItem(
    @Param('id') order_id: string,
    @Param('itemId') item_id: string,
    @Request() req,
  ) {
    return this.cashierService.removeOrderItem(order_id, item_id, req.user.restaurant_id);
  }

  // ─── Billing (Phase 2 carry-over) ─────────────────────────────────────────

  @Get('orders')
  getServedOrders(@Query('restaurant_id') restaurant_id: string) {
    return this.cashierService.getServedOrders(restaurant_id);
  }

  @Patch('orders/:id/pay')
  payOrder(@Param('id') order_id: string) {
    return this.cashierService.payOrder(order_id);
  }
}
