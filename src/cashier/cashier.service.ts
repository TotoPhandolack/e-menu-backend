import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events/events.gateway';
import { MoveTableDto } from './dto/move-table.dto';
import { CreateCashierOrderDto } from './dto/create-cashier-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderStatus } from '../../generated/prisma';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
import { ReprintDto } from './dto/reprint.dto';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { MenuItemService } from '../menu-item/menu-item.service';

const CLOSED_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CANCELLED,
];

const round = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class CashierService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private menuItemService: MenuItemService,
  ) {}

  // ─── Table & Session Management ───────────────────────────────────────────

  async openTable(table_id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: table_id },
    });
    if (!table || !table.is_active)
      throw new NotFoundException('Table not found');
    if (table.status === 'OCCUPIED')
      throw new BadRequestException('Table is already occupied');

    return this.prisma.table.update({
      where: { id: table_id },
      data: { status: 'OCCUPIED' },
    });
  }

  async moveTable(source_table_id: string, dto: MoveTableDto) {
    const { target_table_id } = dto;

    if (source_table_id === target_table_id)
      throw new BadRequestException(
        'Source and target table must be different',
      );

    const [source, target] = await Promise.all([
      this.prisma.table.findUnique({ where: { id: source_table_id } }),
      this.prisma.table.findUnique({ where: { id: target_table_id } }),
    ]);

    if (!source || !source.is_active)
      throw new NotFoundException('Source table not found');
    if (!target || !target.is_active)
      throw new NotFoundException('Target table not found');
    if (target.status === 'OCCUPIED')
      throw new BadRequestException('Target table is already occupied');

    return this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          table_id: source_table_id,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        data: { table_id: target_table_id },
      });

      await tx.table.update({
        where: { id: source_table_id },
        data: { status: 'AVAILABLE' },
      });

      return tx.table.update({
        where: { id: target_table_id },
        data: { status: 'OCCUPIED' },
      });
    });
  }

  async clearTable(table_id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: table_id },
    });
    if (!table || !table.is_active)
      throw new NotFoundException('Table not found');

    const qr_code_token = randomUUID();
    const qr_url = `${process.env.FRONTEND_URL}/menu?token=${qr_code_token}`;
    const qr_image = await QRCode.toDataURL(qr_url);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          table_id,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      return tx.table.update({
        where: { id: table_id },
        data: { qr_code_token, status: 'AVAILABLE' },
      });
    });

    return { ...updated, qr_image };
  }

  // ─── Order Management ─────────────────────────────────────────────────────

  async createCashierOrder(dto: CreateCashierOrderDto, restaurant_id: string) {
    let table_id: string | undefined;
    let queue_number: string | undefined;

    if (dto.order_type === 'TABLE') {
      if (!dto.table_id)
        throw new BadRequestException('table_id is required for TABLE orders');

      const table = await this.prisma.table.findUnique({
        where: { id: dto.table_id },
      });
      if (!table || !table.is_active)
        throw new NotFoundException('Table not found or inactive');
      if (table.restaurant_id !== restaurant_id)
        throw new BadRequestException(
          'Table does not belong to your restaurant',
        );

      table_id = table.id;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const count = await this.prisma.order.count({
        where: {
          restaurant_id,
          order_type: 'TAKEAWAY',
          created_at: { gte: today },
        },
      });
      queue_number = `T-${String(count + 1).padStart(3, '0')}`;
    }

    const menuItemIds = dto.items.map((i) => i.menu_item_id);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, is_available: true, restaurant_id },
    });
    if (menuItems.length !== dto.items.length)
      throw new BadRequestException(
        'Some menu items are unavailable or not in your restaurant',
      );

    const total_amount = dto.items.reduce((sum, item) => {
      const found = menuItems.find((m) => m.id === item.menu_item_id)!;
      return sum + Number(found.price) * item.quantity;
    }, 0);

    const newOrder = await this.prisma.order.create({
      data: {
        restaurant_id,
        table_id,
        session_id: `cashier-${randomUUID()}`,
        order_type: dto.order_type,
        queue_number,
        total_amount,
        orderItems: {
          create: dto.items.map((item) => {
            const found = menuItems.find((m) => m.id === item.menu_item_id)!;
            return {
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              unit_price: found.price,
              special_note: item.special_note,
            };
          }),
        },
      },
      include: {
        table: { select: { id: true, table_number: true } },
        orderItems: {
          include: {
            menuItem: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });

    this.eventsGateway.notifyNewOrder(restaurant_id, newOrder);
    return newOrder;
  }

  getLiveOrders(restaurant_id: string) {
    return this.prisma.order.findMany({
      where: {
        restaurant_id,
        status: { notIn: CLOSED_STATUSES },
      },
      include: {
        table: { select: { id: true, table_number: true } },
        orderItems: {
          include: {
            menuItem: { select: { id: true, name: true, price: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async addOrderItems(
    order_id: string,
    dto: AddOrderItemsDto,
    restaurant_id: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurant_id !== restaurant_id)
      throw new BadRequestException('Order does not belong to your restaurant');
    if (order.status === 'PAID' || order.status === 'CANCELLED')
      throw new BadRequestException('Cannot modify a closed order');

    const menuItemIds = dto.items.map((i) => i.menu_item_id);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, is_available: true, restaurant_id },
    });
    if (menuItems.length !== dto.items.length)
      throw new BadRequestException(
        'Some menu items are unavailable or not in your restaurant',
      );

    return this.prisma.$transaction(async (tx) => {
      await tx.orderItem.createMany({
        data: dto.items.map((item) => {
          const found = menuItems.find((m) => m.id === item.menu_item_id)!;
          return {
            order_id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: found.price,
            special_note: item.special_note,
          };
        }),
      });

      const allItems = await tx.orderItem.findMany({ where: { order_id } });
      const total_amount = allItems.reduce(
        (sum, i) => sum + Number(i.unit_price) * i.quantity,
        0,
      );

      return tx.order.update({
        where: { id: order_id },
        data: { total_amount },
        include: {
          table: { select: { id: true, table_number: true } },
          orderItems: {
            include: {
              menuItem: { select: { id: true, name: true, price: true } },
            },
          },
        },
      });
    });
  }

  async updateOrderItem(
    order_id: string,
    item_id: string,
    dto: UpdateOrderItemDto,
    restaurant_id: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurant_id !== restaurant_id)
      throw new BadRequestException('Order does not belong to your restaurant');
    if (order.status === 'PAID' || order.status === 'CANCELLED')
      throw new BadRequestException('Cannot modify a closed order');

    const item = await this.prisma.orderItem.findUnique({
      where: { id: item_id },
    });
    if (!item || item.order_id !== order_id)
      throw new NotFoundException('Order item not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: item_id },
        data: {
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.special_note !== undefined && {
            special_note: dto.special_note,
          }),
        },
      });

      const allItems = await tx.orderItem.findMany({ where: { order_id } });
      const total_amount = allItems.reduce(
        (sum, i) => sum + Number(i.unit_price) * i.quantity,
        0,
      );

      return tx.order.update({
        where: { id: order_id },
        data: { total_amount },
        include: {
          table: { select: { id: true, table_number: true } },
          orderItems: {
            include: {
              menuItem: { select: { id: true, name: true, price: true } },
            },
          },
        },
      });
    });
  }

  async removeOrderItem(
    order_id: string,
    item_id: string,
    restaurant_id: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurant_id !== restaurant_id)
      throw new BadRequestException('Order does not belong to your restaurant');
    if (order.status === 'PAID' || order.status === 'CANCELLED')
      throw new BadRequestException('Cannot modify a closed order');

    const item = await this.prisma.orderItem.findUnique({
      where: { id: item_id },
    });
    if (!item || item.order_id !== order_id)
      throw new NotFoundException('Order item not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id: item_id } });

      const allItems = await tx.orderItem.findMany({ where: { order_id } });
      const total_amount = allItems.reduce(
        (sum, i) => sum + Number(i.unit_price) * i.quantity,
        0,
      );

      return tx.order.update({
        where: { id: order_id },
        data: { total_amount },
        include: {
          table: { select: { id: true, table_number: true } },
          orderItems: {
            include: {
              menuItem: { select: { id: true, name: true, price: true } },
            },
          },
        },
      });
    });
  }

  // ─── Operations & Menu Control ────────────────────────────────────────────

  async setMenuItemAvailability(
    item_id: string,
    dto: ToggleAvailabilityDto,
    restaurant_id: string,
  ) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: item_id },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurant_id !== restaurant_id)
      throw new BadRequestException(
        'Menu item does not belong to your restaurant',
      );

    return this.prisma.menuItem.update({
      where: { id: item_id },
      data: { is_available: dto.is_available },
      select: { id: true, name: true, is_available: true },
    });
  }

  async setMenuItemRecommended(
    item_id: string,
    dto: ToggleAvailabilityDto,
    restaurant_id: string,
  ) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: item_id },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurant_id !== restaurant_id)
      throw new BadRequestException(
        'Menu item does not belong to your restaurant',
      );

    return this.prisma.menuItem.update({
      where: { id: item_id },
      data: { is_recommended: dto.is_available },
      select: { id: true, name: true, is_recommended: true },
    });
  }

  private async _loadOrderForPrint(order_id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
          },
        },
        table: { select: { table_number: true } },
        orderItems: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async printReceipt(order_id: string) {
    const order = await this._loadOrderForPrint(order_id);

    const items = order.orderItems.map((i) => ({
      name: i.menuItem.name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      line_total: round(Number(i.unit_price) * i.quantity),
      special_note: i.special_note ?? null,
    }));

    const subtotal = items.reduce((s, i) => s + i.line_total, 0);

    return {
      print_type: 'RECEIPT',
      generated_at: new Date().toISOString(),
      restaurant: {
        name: order.restaurant?.name ?? '',
        address: order.restaurant?.address ?? '',
      },
      order: {
        id: order.id,
        order_type: order.order_type,
        table_number: order.table?.table_number ?? null,
        queue_number: order.queue_number ?? null,
        created_at: order.created_at,
      },
      items,
      subtotal,
    };
  }

  async printKitchenTicket(order_id: string) {
    const order = await this._loadOrderForPrint(order_id);
    if (order.status === 'CANCELLED')
      throw new BadRequestException(
        'Cannot print ticket for a cancelled order',
      );

    return {
      print_type: 'KITCHEN_TICKET',
      generated_at: new Date().toISOString(),
      order: {
        id: order.id,
        order_type: order.order_type,
        table_number: order.table?.table_number ?? null,
        queue_number: order.queue_number ?? null,
        created_at: order.created_at,
      },
      items: order.orderItems.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        special_note: i.special_note ?? null,
      })),
    };
  }

  async reprint(dto: ReprintDto) {
    return dto.type === 'receipt'
      ? this.printReceipt(dto.order_id)
      : this.printKitchenTicket(dto.order_id);
  }

  // ─── Menu Item Management ─────────────────────────────────────────────────

  getMenuItems(restaurant_id: string) {
    return this.menuItemService.findAll(restaurant_id, true);
  }

  // ─── QR Code ──────────────────────────────────────────────────────────────

  async getTableQR(table_id: string, restaurant_id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: table_id },
    });
    if (!table || !table.is_active)
      throw new NotFoundException('Table not found');
    if (table.restaurant_id !== restaurant_id)
      throw new NotFoundException('Table not found');

    const qr_url = `${process.env.FRONTEND_URL}/menu?token=${table.qr_code_token}`;
    const qr_image = await QRCode.toDataURL(qr_url);
    return { table_id: table.id, table_number: table.table_number, qr_image };
  }

  async getRestaurantQR(restaurant_id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurant_id },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const qr_url = `${process.env.FRONTEND_URL}/menu?restaurant_id=${restaurant_id}`;
    const qr_image = await QRCode.toDataURL(qr_url);
    return { restaurant_id, restaurant_name: restaurant.name, qr_image };
  }
}
