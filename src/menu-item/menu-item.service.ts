// menu-item/menu-item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  // ดึงเมนูทั้งหมดของร้าน จัดกลุ่มตาม category
  findAll(restaurant_id: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurant_id, is_available: true },
      include: { category: true },
      orderBy: { category: { sort_order: 'asc' } },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  create(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  // soft delete — แค่ปิดไม่ให้แสดงในเมนู
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { is_available: false },
    });
  }
}
