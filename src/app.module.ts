import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { TableModule } from './table/table.module';
import { CategoryModule } from './category/category.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { OrderModule } from './order/order.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { CashierModule } from './cashier/cashier.module';

@Module({
  imports: [
    PrismaModule,
    RestaurantModule,
    TableModule,
    CategoryModule,
    MenuItemModule,
    OrderModule,
    EventsModule,
    AuthModule,
    CashierModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
