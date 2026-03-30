// table/table.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { VerifyLocationDto } from './dto/verify-location.dto';

@Controller('tables')
export class TableController {
    constructor(private readonly tableService: TableService) { }

    // ดูโต๊ะทั้งหมดของร้าน
    @Get('restaurant/:restaurant_id')
    findAll(@Param('restaurant_id') restaurant_id: string) {
        return this.tableService.findAll(restaurant_id);
    }
    // customer scan QR แล้วเรียก endpoint นี้เพื่อตรวจ token
    @Post('scan/:token')
    scanQR(
        @Param('token') token: string,
        @Body() dto: VerifyLocationDto,
    ) {
        return this.tableService.verifyLocationAndScan(token, dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tableService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateTableDto) {
        return this.tableService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
        return this.tableService.update(id, dto);
    }

    // regenerate QR ใหม่
    @Put(':id/regenerate-qr')
    regenerateQR(@Param('id') id: string) {
        return this.tableService.regenerateQR(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tableService.remove(id);
    }
}