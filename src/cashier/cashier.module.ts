// cashier/cashier.module.ts
import { Module } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashierController],
  providers: [CashierService],
})
export class CashierModule {}
