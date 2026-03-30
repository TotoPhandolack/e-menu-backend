// category/category.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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
            include: { menuItems: true }, // ดึง menuItems มาด้วยเลย
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { menuItems: true },
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    create(dto: CreateCategoryDto) {
        return this.prisma.category.create({ data: dto });
    }

    async update(id: string, dto: UpdateCategoryDto) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.category.delete({ where: { id } });
    }
}