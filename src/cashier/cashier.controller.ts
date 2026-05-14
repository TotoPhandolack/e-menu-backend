import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MoveTableDto } from './dto/move-table.dto';
import { CreateCashierOrderDto } from './dto/create-cashier-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
import { ReprintDto } from './dto/reprint.dto';

type JwtReq = { user: { restaurant_id: string } };

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

  @Post('orders')
  createOrder(@Body() dto: CreateCashierOrderDto, @Request() req: JwtReq) {
    return this.cashierService.createCashierOrder(dto, req.user.restaurant_id);
  }

  @Get('orders/live')
  getLiveOrders(@Request() req: JwtReq) {
    return this.cashierService.getLiveOrders(req.user.restaurant_id);
  }

  @Post('orders/:id/items')
  addOrderItems(
    @Param('id') order_id: string,
    @Body() dto: AddOrderItemsDto,
    @Request() req: JwtReq,
  ) {
    return this.cashierService.addOrderItems(
      order_id,
      dto,
      req.user.restaurant_id,
    );
  }

  @Patch('orders/:id/items/:itemId')
  updateOrderItem(
    @Param('id') order_id: string,
    @Param('itemId') item_id: string,
    @Body() dto: UpdateOrderItemDto,
    @Request() req: JwtReq,
  ) {
    return this.cashierService.updateOrderItem(
      order_id,
      item_id,
      dto,
      req.user.restaurant_id,
    );
  }

  @Delete('orders/:id/items/:itemId')
  removeOrderItem(
    @Param('id') order_id: string,
    @Param('itemId') item_id: string,
    @Request() req: JwtReq,
  ) {
    return this.cashierService.removeOrderItem(
      order_id,
      item_id,
      req.user.restaurant_id,
    );
  }

  // ─── Operations & Menu Control ────────────────────────────────────────────

  @Patch('menu-items/:id/availability')
  setMenuItemAvailability(
    @Param('id') item_id: string,
    @Body() dto: ToggleAvailabilityDto,
    @Request() req: JwtReq,
  ) {
    return this.cashierService.setMenuItemAvailability(
      item_id,
      dto,
      req.user.restaurant_id,
    );
  }

  @Patch('menu-items/:id/recommended')
  setMenuItemRecommended(
    @Param('id') item_id: string,
    @Body() dto: ToggleAvailabilityDto,
    @Request() req: JwtReq,
  ) {
    return this.cashierService.setMenuItemRecommended(
      item_id,
      dto,
      req.user.restaurant_id,
    );
  }

  @Post('print/receipt/:orderId')
  printReceipt(@Param('orderId') order_id: string) {
    return this.cashierService.printReceipt(order_id);
  }

  @Post('print/kitchen/:orderId')
  printKitchenTicket(@Param('orderId') order_id: string) {
    return this.cashierService.printKitchenTicket(order_id);
  }

  @Post('print/reprint')
  reprint(@Body() dto: ReprintDto) {
    return this.cashierService.reprint(dto);
  }

  // ─── Menu Item Management ─────────────────────────────────────────────────

  @Get('menu-items')
  getMenuItems(@Request() req: JwtReq) {
    return this.cashierService.getMenuItems(req.user.restaurant_id);
  }

  // ─── QR Code ──────────────────────────────────────────────────────────────

  @Get('tables/:id/qr')
  getTableQR(@Param('id') table_id: string, @Request() req: JwtReq) {
    return this.cashierService.getTableQR(table_id, req.user.restaurant_id);
  }

  @Get('qr/restaurant')
  getRestaurantQR(@Request() req: JwtReq) {
    return this.cashierService.getRestaurantQR(req.user.restaurant_id);
  }
}
