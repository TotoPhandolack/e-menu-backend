import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoveTableDto } from './dto/move-table.dto';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class CashierService {
  constructor(private prisma: PrismaService) {}

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
      // Cancel any orders that were not properly closed before clearing
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

  // ─── Orders (existing) ────────────────────────────────────────────────────

  async getServedOrders(restaurant_id: string) {
    return this.prisma.order.findMany({
      where: {
        table: { restaurant_id },
        status: 'SERVED',
      },
      include: {
        table: {
          select: { id: true, table_number: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async payOrder(order_id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: order_id },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: order_id },
      data: { status: 'PAID' },
      include: {
        table: { select: { id: true, table_number: true } },
        orderItems: {
          include: {
            menuItem: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });
  }
}
