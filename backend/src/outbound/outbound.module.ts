import { Module } from '@nestjs/common';
import { OutboundService } from './outbound.service';
import { OutboundController } from './outbound.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OutboundService],
  controllers: [OutboundController]
})
export class OutboundModule { }
