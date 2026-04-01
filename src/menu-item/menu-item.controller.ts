// menu-item/menu-item.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Get('restaurant/:restaurant_id')
  findAll(@Param('restaurant_id') restaurant_id: string) {
    return this.menuItemService.findAll(restaurant_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuItemService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuItemService.remove(id);
  }
}
