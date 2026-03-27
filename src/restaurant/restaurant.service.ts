// restaurant/restaurant.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.restaurant.findMany({
            where: { is_active: true },
        });
    }

    async findOne(id: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
        });
        if (!restaurant) throw new NotFoundException('Restaurant not found');
        return restaurant;
    }

    create(dto: CreateRestaurantDto) {
        return this.prisma.restaurant.create({ data: dto });
    }

    async update(id: string, dto: UpdateRestaurantDto) {
        await this.findOne(id); // เช็คว่ามีอยู่ก่อน
        return this.prisma.restaurant.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.restaurant.update({
            where: { id },
            data: { is_active: false }, // soft delete
        });
    }
}