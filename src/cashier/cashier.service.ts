// cashier/cashier.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashierService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns all orders for a restaurant that are ready to be paid (SERVED status).
   * Cashiers call this to see what bills need to be collected.
   */
  async getServedOrders(restaurant_id: string) {
    return this.prisma.order.findMany({
      where: {
        table: { restaurant_id },
        status: 'SERVED',
      },
      include: {
        table: {
          select: {
            id: true,
            table_number: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Marks an order as PAID.
   */
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
