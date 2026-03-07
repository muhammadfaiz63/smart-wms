import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockStatus, TransactionType } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getSummary() {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const now = new Date();

            const [
                totalProducts,
                totalStockResult,
                inboundTodayResult,
                outboundTodayResult,
                nearExpiredCount,
            ] = await Promise.all([
                this.prisma.product.count(),

                this.prisma.stock.aggregate({
                    _sum: { qty: true },
                }),

                this.prisma.transaction.aggregate({
                    where: {
                        type: TransactionType.IN,
                        timestamp: { gte: startOfToday },
                    },
                    _sum: { qty: true },
                }),

                this.prisma.transaction.aggregate({
                    where: {
                        type: TransactionType.OUT,
                        timestamp: { gte: startOfToday },
                    },
                    _sum: { qty: true },
                }),

                this.prisma.stock.count({
                    where: {
                        qty: { gt: 0 },
                        status: StockStatus.AVAILABLE,
                        expired_at: {
                            gt: now,
                            lte: thirtyDaysFromNow,
                        },
                    },
                }),
            ]);

            return {
                total_products: totalProducts,
                total_stock: totalStockResult._sum.qty || 0,
                inbound_today: inboundTodayResult._sum.qty || 0,
                outbound_today: outboundTodayResult._sum.qty || 0,
                near_expired_count: nearExpiredCount,
                generated_at: new Date(),
            };
        } catch (error) {
            console.error('Failed to generate report summary:', error);
            throw new InternalServerErrorException('Failed to generate report summary');
        }
    }
}
