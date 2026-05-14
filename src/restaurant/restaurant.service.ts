// restaurant/restaurant.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ScanRestaurantDto } from './dto/scan-restaurant.dto';
import { calculateDistance } from '../../common/utils/location.util';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

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
      data: { is_active: false },
    });
  }

  async scanByLocation(id: string, dto: ScanRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id, is_active: true },
      include: {
        categories: {
          orderBy: { sort_order: 'asc' },
          include: {
            menuItems: { where: { is_available: true } },
          },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const distance = calculateDistance(
      dto.latitude,
      dto.longitude,
      restaurant.latitude,
      restaurant.longitude,
    );

    if (distance > restaurant.radius_meters) {
      throw new BadRequestException(
        `You are ${Math.round(distance)}m away. Must be within ${restaurant.radius_meters}m of the restaurant.`,
      );
    }

    return {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      distance_meters: Math.round(distance),
      categories: restaurant.categories,
    };
  }
}
