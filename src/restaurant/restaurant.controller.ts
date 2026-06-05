// restaurant/restaurant.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ScanRestaurantDto } from './dto/scan-restaurant.dto';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  @Post(':id/scan')
  scanByLocation(@Param('id') id: string, @Body() dto: ScanRestaurantDto) {
    return this.restaurantService.scanByLocation(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'restaurants'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.restaurantService.uploadLogo(id, file.filename);
  }
}
