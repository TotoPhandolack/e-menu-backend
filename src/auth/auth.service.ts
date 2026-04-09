// auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // เช็คว่า email ซ้ำไหม
    const existing = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    // hash password
    const hashed = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        ...dto,
        password: hashed,
      },
    });

    return { message: 'Admin created successfully', id: admin.id };
  }

  async login(dto: LoginDto) {
    // หา admin จาก email
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
      include: { restaurant: true },
    });

    if (!admin) throw new UnauthorizedException('Invalid credentials');

    // เช็ค password
    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // สร้าง JWT token
    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      restaurant_id: admin.restaurant_id,
    });

    return {
      access_token: token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        restaurant_id: admin.restaurant_id,
        restaurant_name: admin.restaurant.name,
      },
    };
  }

  async getMe(adminId: string) {
    return this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        restaurant_id: true,
        restaurant: { select: { name: true } },
      },
    });
  }
}
