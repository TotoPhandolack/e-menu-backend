// order/order.controller.ts
import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ลูกค้าดู order ของโต๊ะตัวเอง
  @Get('table/:table_id')
  findByTable(@Param('table_id') table_id: string) {
    return this.orderService.findByTable(table_id);
  }

  // แคชเชียร์/เชฟดู order ทั้งหมดของร้าน
  @Get('restaurant/:restaurant_id')
  findByRestaurant(@Param('restaurant_id') restaurant_id: string) {
    return this.orderService.findByRestaurant(restaurant_id);
  }

  // เชฟ/แคชเชียร์อัปเดต status
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  // ลูกค้ายกเลิก order
  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.orderService.cancel(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // ลูกค้ากดสั่งอาหาร
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }
}
