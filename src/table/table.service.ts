// table/table.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class TableService {
    constructor(private prisma: PrismaService) { }

    findAll(restaurant_id: string) {
        return this.prisma.table.findMany({
            where: { restaurant_id, is_active: true },
        });
    }

    async findOne(id: string) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) throw new NotFoundException('Table not found');
        return table;
    }

    async create(dto: CreateTableDto) {
        // generate token unique ให้แต่ละโต๊ะ
        const qr_code_token = randomUUID();

        // URL ที่ลูกค้าจะถูก redirect ไปเมื่อ scan
        const qr_url = `${process.env.FRONTEND_URL}/menu?token=${qr_code_token}`;

        // แปลง URL เป็น QR image (base64)
        const qr_image = await QRCode.toDataURL(qr_url);

        const table = await this.prisma.table.create({
            data: {
                ...dto,
                qr_code_token,
            },
        });

        // return ทั้ง table data และ QR image ให้ frontend เอาไปแสดง/print
        return { ...table, qr_image };
    }

    async update(id: string, dto: UpdateTableDto) {
        await this.findOne(id);
        return this.prisma.table.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.table.update({
            where: { id },
            data: { is_active: false }, // soft delete
        });
    }

    // regenerate QR ใหม่ เช่น กรณี token หลุด
    async regenerateQR(id: string) {
        const table = await this.findOne(id);
        const qr_code_token = randomUUID();
        const qr_url = `${process.env.FRONTEND_URL}/menu?token=${qr_code_token}`;
        const qr_image = await QRCode.toDataURL(qr_url);

        const updated = await this.prisma.table.update({
            where: { id },
            data: { qr_code_token },
        });

        return { ...updated, qr_image };
    }

    // ใช้ตอน customer scan QR — เช็คว่า token นี้ถูกต้องไหม
    async findByToken(token: string) {
        const table = await this.prisma.table.findUnique({
            where: { qr_code_token: token },
            include: { restaurant: true },
        });
        if (!table || !table.is_active) throw new NotFoundException('Invalid QR Code');
        return table;
    }
}