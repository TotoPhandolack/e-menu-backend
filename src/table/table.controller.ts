// table/table.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { VerifyLocationDto } from './dto/verify-location.dto';

type JwtReq = { user: { restaurant_id: string } };

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('restaurant/:restaurant_id')
  findAll(@Param('restaurant_id') restaurant_id: string) {
    return this.tableService.findAll(restaurant_id);
  }

  @Get('scan/:token')
  scanQRNoLocation(@Param('token') token: string) {
    return this.tableService.scanByToken(token);
  }

  @Post('scan/:token')
  scanQR(@Param('token') token: string, @Body() dto: VerifyLocationDto) {
    return this.tableService.verifyLocationAndScan(token, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tableService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
    @Request() req: JwtReq,
  ) {
    return this.tableService.update(id, dto, req.user.restaurant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/regenerate-qr')
  regenerateQR(@Param('id') id: string, @Request() req: JwtReq) {
    return this.tableService.regenerateQR(id, req.user.restaurant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: JwtReq) {
    return this.tableService.remove(id, req.user.restaurant_id);
  }
}
