import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { TransactionType, StockStatus } from '@prisma/client';

@Injectable()
export class OutboundService {
    constructor(private prisma: PrismaService) { }

    async processOutbound(userId: number, dto: CreateOutboundDto) {
        const { productId, qty } = dto;

        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        const availableStocks = await this.prisma.stock.findMany({
            where: {
                productId,
                qty: { gt: 0 },
                status: StockStatus.AVAILABLE,
            },
            orderBy: [
                { expired_at: 'asc' },
                { updatedAt: 'asc' },
            ],
            include: {
                location: true
            }
        });

        const totalAvailable = availableStocks.reduce((sum, stock) => sum + stock.qty, 0);
        if (totalAvailable < qty) {
            throw new BadRequestException(`Insufficient total stock for product. Available: ${totalAvailable}, Requested: ${qty}`);
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                let remainingQtyNeeded = qty;
                const pickedDetails: { bin: string; batch: string; qty_taken: number }[] = [];

                for (const stock of availableStocks) {
                    if (remainingQtyNeeded <= 0) break;

                    const qtyToTakeFromThisStock = Math.min(stock.qty, remainingQtyNeeded);

                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            qty: { decrement: qtyToTakeFromThisStock },
                            updatedAt: new Date(),
                        },
                    });

                    await tx.transaction.create({
                        data: {
                            type: TransactionType.OUT,
                            productId,
                            locationId: stock.locationId,
                            batch_no: stock.batch_no,
                            qty: qtyToTakeFromThisStock,
                            userId,
                            timestamp: new Date(),
                        },
                    });

                    pickedDetails.push({
                        bin: stock.location.bin_code,
                        batch: stock.batch_no,
                        qty_taken: qtyToTakeFromThisStock
                    });

                    remainingQtyNeeded -= qtyToTakeFromThisStock;
                }

                const suggestionText = pickedDetails.map(d => `${d.qty_taken} from Batch ${d.batch} in Bin ${d.bin}`).join(', ');

                return {
                    status: 'SUCCESS',
                    message: 'Outbound processed successfully using FEFO.',
                    suggestion: `Silakan ambil barang: ${suggestionText}`,
                    details: pickedDetails
                };
            });
        } catch (error) {
            console.error('Outbound FEFO transaction failed:', error);
            throw new InternalServerErrorException('Failed to process outbound transaction');
        }
    }
}
