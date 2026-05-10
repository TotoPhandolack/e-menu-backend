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
import { SplitBillDto } from './dto/split-bill.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

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
      // TAKEAWAY — generate daily queue number
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

    // Validate menu items
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

      // Recalculate total from all items
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

  // ─── Billing & Payments ───────────────────────────────────────────────────

  private async _loadOrderForBilling(order_id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
      include: {
        restaurant: true,
        orderItems: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'PAID')
      throw new BadRequestException('Order is already paid');
    if (order.status === 'CANCELLED')
      throw new BadRequestException('Order is cancelled');
    return order;
  }

  private _calcBill(
    order: Awaited<ReturnType<CashierService['_loadOrderForBilling']>>,
  ) {
    const subtotal = order.orderItems.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0,
    );
    const vat_rate = Number(order.restaurant?.vat_rate ?? 7);
    const sc_rate = Number(order.restaurant?.service_charge_rate ?? 0);
    const vat_amount = subtotal * (vat_rate / 100);
    const service_charge_amount = subtotal * (sc_rate / 100);
    const total_amount = subtotal + vat_amount + service_charge_amount;
    const already_paid = order.payments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );

    return {
      subtotal: round(subtotal),
      vat_rate,
      vat_amount: round(vat_amount),
      service_charge_rate: sc_rate,
      service_charge_amount: round(service_charge_amount),
      total_amount: round(total_amount),
      already_paid: round(already_paid),
      remaining_balance: round(total_amount - already_paid),
    };
  }

  async getBill(order_id: string) {
    const order = await this._loadOrderForBilling(order_id);
    const bill = this._calcBill(order);
    return {
      order_id,
      order_type: order.order_type,
      queue_number: order.queue_number,
      table_id: order.table_id,
      ...bill,
      items: order.orderItems.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        line_total: round(Number(item.unit_price) * item.quantity),
        special_note: item.special_note,
      })),
    };
  }

  async splitBill(order_id: string, dto: SplitBillDto) {
    const order = await this._loadOrderForBilling(order_id);
    const bill = this._calcBill(order);

    if (dto.mode === 'equal') {
      const n = dto.number_of_people!;
      const per_person = round(bill.total_amount / n);
      const splits = Array.from({ length: n }, (_, i) => ({
        label: `Person ${i + 1}`,
        amount:
          i === n - 1
            ? round(bill.total_amount - per_person * (n - 1))
            : per_person,
      }));
      return { mode: 'equal', total_amount: bill.total_amount, splits };
    }

    // by_item mode
    const splits = dto.splits!;
    const allItemIds = splits.flatMap((s) => s.item_ids);
    const orderItemIds = order.orderItems.map((i) => i.id);
    const invalid = allItemIds.filter((id) => !orderItemIds.includes(id));
    if (invalid.length > 0)
      throw new BadRequestException(
        `Item IDs not in this order: ${invalid.join(', ')}`,
      );

    const result = splits.map((split) => {
      const items = split.item_ids.map(
        (id) => order.orderItems.find((i) => i.id === id)!,
      );
      const subtotal = items.reduce(
        (s, i) => s + Number(i.unit_price) * i.quantity,
        0,
      );
      const vat = round(subtotal * (bill.vat_rate / 100));
      const sc = round(subtotal * (bill.service_charge_rate / 100));
      return {
        label: split.label,
        items: items.map((i) => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          line_total: round(Number(i.unit_price) * i.quantity),
        })),
        subtotal: round(subtotal),
        vat_amount: vat,
        service_charge_amount: sc,
        amount: round(subtotal + vat + sc),
      };
    });

    return { mode: 'by_item', total_amount: bill.total_amount, splits: result };
  }

  async processPayment(
    order_id: string,
    dto: ProcessPaymentDto,
    restaurant_id: string,
  ) {
    const order = await this._loadOrderForBilling(order_id);
    if (order.restaurant_id !== restaurant_id)
      throw new BadRequestException('Order does not belong to your restaurant');

    const bill = this._calcBill(order);

    const change =
      dto.amount > bill.remaining_balance
        ? round(dto.amount - bill.remaining_balance)
        : 0;
    const applied = round(dto.amount - change);
    const new_total_paid = round(bill.already_paid + applied);
    const is_fully_paid = new_total_paid >= bill.total_amount - 0.001;

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: { order_id, method: dto.method, amount: applied },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order_id },
        data: {
          subtotal: bill.subtotal,
          vat_amount: bill.vat_amount,
          service_charge_amount: bill.service_charge_amount,
          total_amount: bill.total_amount,
          ...(is_fully_paid && { status: 'PAID' }),
        },
      });

      if (is_fully_paid && order.table_id) {
        await tx.table.update({
          where: { id: order.table_id },
          data: { status: 'AVAILABLE' },
        });
      }

      return {
        order_id,
        order_status: updatedOrder.status,
        ...bill,
        payment_recorded: { method: dto.method, amount: applied },
        total_paid: new_total_paid,
        remaining_balance: is_fully_paid
          ? 0
          : round(bill.total_amount - new_total_paid),
        change,
        is_fully_paid,
      };
    });
  }
}
