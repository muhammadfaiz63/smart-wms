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
                quarantinedCount,
                expiredCount,
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

                this.prisma.stock.aggregate({
                    where: { status: StockStatus.QUARANTINED },
                    _sum: { qty: true }
                }),

                this.prisma.stock.aggregate({
                    where: {
                        status: StockStatus.AVAILABLE,
                        expired_at: { lt: now }
                    },
                    _sum: { qty: true }
                })
            ]);

            // Generate Monthly Throughput for Area Chart (Mock logic mixed with real DB data for last 6 months)
            // Ideally, we group by month in Prisma, but SQLite/Postgres grouping differs. Let's do a simple aggregate.
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const recentTransactions = await this.prisma.transaction.findMany({
                where: { timestamp: { gte: sixMonthsAgo } },
                select: { qty: true, timestamp: true, type: true }
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const throughput: { name: string, value: number }[] = [];

            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date();
                targetDate.setMonth(now.getMonth() - i);
                const monthName = monthNames[targetDate.getMonth()];
                const year = targetDate.getFullYear();

                // Sum inbound qty for this month
                const monthlyTotal = recentTransactions.filter(t =>
                    t.timestamp.getMonth() === targetDate.getMonth() &&
                    t.timestamp.getFullYear() === year
                ).reduce((acc, curr) => acc + curr.qty, 0);

                throughput.push({ name: monthName, value: monthlyTotal });
            }

            return {
                total_products: totalProducts,
                total_stock: totalStockResult._sum.qty || 0,
                inbound_today: inboundTodayResult._sum.qty || 0,
                outbound_today: outboundTodayResult._sum.qty || 0,
                near_expired_count: nearExpiredCount,
                quarantined_items: quarantinedCount._sum.qty || 0,
                expired_items: expiredCount._sum.qty || 0,
                throughput,
                generated_at: new Date(),
            };
        } catch (error) {
            console.error('Failed to generate report summary:', error);
            throw new InternalServerErrorException('Failed to generate report summary');
        }
    }
}
