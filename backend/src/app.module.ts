import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { LocationModule } from './location/location.module';
import { InboundModule } from './inbound/inbound.module';
import { InventoryModule } from './inventory/inventory.module';
import { OutboundModule } from './outbound/outbound.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductModule, LocationModule, InboundModule, InventoryModule, OutboundModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
