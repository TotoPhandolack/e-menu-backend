import { Module } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { MenuItemModule } from '../menu-item/menu-item.module';

@Module({
  imports: [PrismaModule, EventsModule, MenuItemModule],
  controllers: [CashierController],
  providers: [CashierService],
})
export class CashierModule {}
