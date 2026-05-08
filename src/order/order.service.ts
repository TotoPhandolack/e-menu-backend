// order/order.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { EventsGateway } from '../events/events/events.gateway';
import { calculateDistance } from '../../common/utils/location.util';


@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) { }

  // ดู order ทั้งหมดของโต๊ะนั้น
  findByTable(table_id: string) {
    return this.prisma.order.findMany({
      where: { table_id },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ดู order ทั้งหมดของร้าน (สำหรับแคชเชียร์/เชฟ)
  findByRestaurant(restaurant_id: string) {
    return this.prisma.order.findMany({
      where: {
        table: { restaurant_id },
        status: { notIn: ['PAID', 'CANCELLED'] },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    // 1. เช็คว่าโต๊ะมีอยู่จริง
    const table = await this.prisma.table.findUnique({
      where: { id: dto.table_id },
      include: { restaurant: true },
    });
    if (!table || !table.is_active) {
      throw new BadRequestException('Table not found or inactive');
    }

    // 2. ตรวจสอบว่าลูกค้าอยู่ในรัศมีของร้านไหมก่อนสั่งอาหาร (Disabled for testing)
    const restaurant = table.restaurant;
    // const distance = calculateDistance(
    //   dto.latitude,
    //   dto.longitude,
    //   restaurant.latitude,
    //   restaurant.longitude,
    // );
    // if (distance > restaurant.radius_meters) {
    //   throw new BadRequestException(
    //     `You must be inside the restaurant to order. You are ${Math.round(distance)}m away (max ${restaurant.radius_meters}m).`,
    //   );
    // }

    // 3. ดึงราคา menuItem ทุกตัวที่สั่ง
    const menuItemIds = dto.items.map((item) => item.menu_item_id);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, is_available: true },
    });

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('Some menu items are unavailable');
    }

    // 3. คำนวณ total
    const total_amount = dto.items.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
      return sum + Number(menuItem!.price) * item.quantity;
    }, 0);

    // 4. สร้าง order พร้อม orderItems ในครั้งเดียว
    const newOrder = await this.prisma.order.create({
      data: {
        table_id: dto.table_id,
        session_id: dto.session_id,
        total_amount,
        orderItems: {
          create: dto.items.map((item) => {
            const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
            return {
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              unit_price: menuItem!.price,
              special_note: item.special_note,
            };
          }),
        },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    this.eventsGateway.notifyNewOrder(table.restaurant_id, newOrder);
    return newOrder;
  }

  // อัปเดต status เช่น เชฟกด PREPARING, แคชเชียร์กด PAID
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    console.log('updating order id:', id);
    console.log('status:', dto.status);
    await this.findOne(id);
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    if (updatedOrder.table) {
      this.eventsGateway.notifyOrderStatus(updatedOrder.table.restaurant_id, updatedOrder);
    }
    return updatedOrder;
  }

  // ยกเลิก order (เฉพาะ PENDING เท่านั้น)
  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel PENDING orders');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
