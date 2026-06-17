// menu-item/menu-item.controller.ts
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MenuItemService } from './menu-item.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

type JwtReq = { user: { restaurant_id: string } };

@Controller('menu-items')
export class MenuItemController {
  constructor(
    private readonly menuItemService: MenuItemService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('restaurant/:restaurant_id')
  findAll(@Param('restaurant_id') restaurant_id: string) {
    return this.menuItemService.findAll(restaurant_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuItemService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @Request() req: JwtReq,
  ) {
    return this.menuItemService.update(id, dto, req.user.restaurant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: JwtReq) {
    return this.menuItemService.remove(id, req.user.restaurant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: JwtReq,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const imageUrl = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      'menu-items',
    );
    return this.menuItemService.uploadImage(id, req.user.restaurant_id, imageUrl);
  }
}
