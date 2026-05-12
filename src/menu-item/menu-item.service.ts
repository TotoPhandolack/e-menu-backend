// menu-item/menu-item.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  findAll(restaurant_id: string, includeAll = false) {
    return this.prisma.menuItem.findMany({
      where: { restaurant_id, ...(includeAll ? {} : { is_available: true }) },
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

  async update(id: string, dto: UpdateMenuItemDto, restaurant_id: string) {
    const item = await this.findOne(id);
    if (item.restaurant_id !== restaurant_id)
      throw new ForbiddenException('Item does not belong to your restaurant');
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string, restaurant_id: string) {
    const item = await this.findOne(id);
    if (item.restaurant_id !== restaurant_id)
      throw new ForbiddenException('Item does not belong to your restaurant');
    return this.prisma.menuItem.update({
      where: { id },
      data: { is_available: false },
    });
  }

  async uploadImage(id: string, restaurant_id: string, filename: string) {
    const item = await this.findOne(id);
    if (item.restaurant_id !== restaurant_id)
      throw new ForbiddenException('Item does not belong to your restaurant');
    return this.prisma.menuItem.update({
      where: { id },
      data: { imge_url: `/uploads/menu-items/${filename}` },
      include: { category: true },
    });
  }
}
