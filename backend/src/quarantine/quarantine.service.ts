import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StockStatus } from '@prisma/client';

@Injectable()
export class QuarantineService {
    private readonly logger = new Logger(QuarantineService.name);

    constructor(private readonly prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_12_HOURS)
    async handleExpiredStockDetection() {
        this.logger.debug('Running background job: Checking for expired stocks...');
        const now = new Date();

        try {
            const expiredStocks = await this.prisma.stock.findMany({
                where: {
                    qty: { gt: 0 },
                    status: StockStatus.AVAILABLE,
                    expired_at: {
                        lte: now,
                    },
                },
            });

            if (expiredStocks.length === 0) {
                this.logger.debug('No expired stocks found.');
                return;
            }

            this.logger.warn(`Found ${expiredStocks.length} expired stock batches. Flagging for Quarantine...`);

            const stockIds = expiredStocks.map(s => s.id);

            const updateResult = await this.prisma.stock.updateMany({
                where: {
                    id: { in: stockIds },
                },
                data: {
                    status: StockStatus.PENDING_QUARANTINE,
                    updatedAt: new Date(),
                },
            });

            this.logger.log(`Successfully flagged ${updateResult.count} stock records as PENDING_QUARANTINE.`);

        } catch (error) {
            this.logger.error('Error occurred during expired stock detection job', error.stack);
        }
    }
}
