import { Module } from '@nestjs/common';
import { QuarantineService } from './quarantine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QuarantineService]
})
export class QuarantineModule { }
