import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { TransactionType, StockStatus } from '@prisma/client';

@Injectable()
export class InboundService {
    constructor(private prisma: PrismaService) { }

    async receiveProduct(userId: number, dto: CreateInboundDto) {
        const { productId, locationId, qty, batchNo, expiredAt } = dto;

        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        const location = await this.prisma.location.findUnique({
            where: { id: locationId },
        });
        if (!location) {
            throw new NotFoundException(`Location with ID ${locationId} not found`);
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const stock = await tx.stock.upsert({
                    where: {
                        productId_locationId_batch_no: {
                            productId,
                            locationId,
                            batch_no: batchNo,
                        },
                    },
                    update: {
                        qty: { increment: qty },
                        updatedAt: new Date(),
                    },
                    create: {
                        productId,
                        locationId,
                        batch_no: batchNo,
                        qty,
                        expired_at: expiredAt ? new Date(expiredAt) : null,
                        status: StockStatus.AVAILABLE,
                    },
                });

                const transaction = await tx.transaction.create({
                    data: {
                        type: TransactionType.IN,
                        productId,
                        locationId,
                        batch_no: batchNo,
                        qty,
                        userId,
                        timestamp: new Date(),
                    },
                });

                return {
                    transactionId: transaction.id,
                    status: 'SUCCESS',
                    message: 'Stock successfully updated',
                    currentStockId: stock.id,
                };
            });
        } catch (error) {
            console.error('Inbound transaction failed:', error);
            throw new InternalServerErrorException('Failed to process inbound transaction');
        }
    }
}
