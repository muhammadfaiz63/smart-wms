import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { LocationModule } from './location/location.module';
import { InboundModule } from './inbound/inbound.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductModule, LocationModule, InboundModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
