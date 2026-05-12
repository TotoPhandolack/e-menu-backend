// category/category.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) { }

  findAll(restaurant_id: string) {
    return this.prisma.category.findMany({
      where: { restaurant_id },
      orderBy: { sort_order: 'asc' },
      include: {
        menuItems: {
          where: { is_available: true },
        },
      }, // ดึง menuItems เฉพาะที่ยัง available มาด้วย
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { is_available: true },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto, restaurant_id: string) {
    const category = await this.findOne(id);
    if (category.restaurant_id !== restaurant_id)
      throw new ForbiddenException('Category does not belong to your restaurant');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, restaurant_id: string) {
    const category = await this.findOne(id);
    if (category.restaurant_id !== restaurant_id)
      throw new ForbiddenException('Category does not belong to your restaurant');
    return this.prisma.category.delete({ where: { id } });
  }
}
