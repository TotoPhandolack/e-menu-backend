import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. สร้าง Connection Pool สำหรับต่อฐานข้อมูล (ใช้ URL จาก .env)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. สร้าง Adapter ของ Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaPg(pool as any);

    // 3. ส่ง Adapter เข้าไปให้ PrismaClient ตามกฎของ v7
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
