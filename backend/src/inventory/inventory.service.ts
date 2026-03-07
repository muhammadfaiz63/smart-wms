import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { TransactionType, StockStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const stocks = await this.prisma.stock.findMany({
            include: {
                product: { select: { sku: true, name: true, unit: true } },
                location: { select: { bin_code: true, zone: true } },
            },
            orderBy: { location: { bin_code: 'asc' } },
        });

        const today = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        return stocks.map((stock) => {
            let isNearExpired = false;
            let isExpired = false;

            if (stock.expired_at) {
                const timeDiff = stock.expired_at.getTime() - today.getTime();
                if (timeDiff <= 0) {
                    isExpired = true;
                } else if (timeDiff <= thirtyDaysMs) {
                    isNearExpired = true;
                }
            }

            return {
                ...stock,
                flags: {
                    isExpired,
                    isNearExpired,
                },
            };
        });
    }

    async transferStock(userId: number, dto: TransferStockDto) {
        const { productId, fromLocationId, toLocationId, batchNo, qty } = dto;

        if (fromLocationId === toLocationId) {
            throw new BadRequestException('Source and destination locations cannot be the same');
        }

        const sourceStock = await this.prisma.stock.findUnique({
            where: {
                productId_locationId_batch_no: {
                    productId,
                    locationId: fromLocationId,
                    batch_no: batchNo,
                },
            },
        });

        if (!sourceStock) {
            throw new NotFoundException(`Stock not found in source location`);
        }

        if (sourceStock.qty < qty) {
            throw new BadRequestException(`Insufficient stock. Available: ${sourceStock.qty}, Requested: ${qty}`);
        }

        const destinationLocation = await this.prisma.location.findUnique({
            where: { id: toLocationId },
        });

        if (!destinationLocation) {
            throw new NotFoundException(`Destination location with ID ${toLocationId} not found`);
        }

        const isMovingToQuarantine = destinationLocation.zone.toUpperCase() === 'QUARANTINE';

        try {
            return await this.prisma.$transaction(async (tx) => {
                const updatedSource = await tx.stock.update({
                    where: { id: sourceStock.id },
                    data: {
                        qty: { decrement: qty },
                        updatedAt: new Date(),
                    },
                });

                const updatedDestination = await tx.stock.upsert({
                    where: {
                        productId_locationId_batch_no: {
                            productId,
                            locationId: toLocationId,
                            batch_no: batchNo,
                        },
                    },
                    update: {
                        qty: { increment: qty },
                        status: isMovingToQuarantine ? StockStatus.QUARANTINED : sourceStock.status,
                        updatedAt: new Date(),
                    },
                    create: {
                        productId,
                        locationId: toLocationId,
                        batch_no: batchNo,
                        qty,
                        expired_at: sourceStock.expired_at,
                        status: isMovingToQuarantine ? StockStatus.QUARANTINED : sourceStock.status,
                    },
                });

                const transaction = await tx.transaction.create({
                    data: {
                        type: TransactionType.TRANSFER,
                        productId,
                        locationId: fromLocationId,
                        batch_no: batchNo,
                        qty,
                        userId,
                        timestamp: new Date(),
                    },
                });

                return {
                    transactionId: transaction.id,
                    status: 'SUCCESS',
                    message: isMovingToQuarantine
                        ? 'Stock quarantine move confirmed. Status updated to QUARANTINED.'
                        : 'Stock successfully transferred.',
                    sourceStockRemaining: updatedSource.qty,
                    destinationStockTotal: updatedDestination.qty,
                };
            });
        } catch (error) {
            console.error('Transfer transaction failed:', error);
            throw new InternalServerErrorException('Failed to process stock transfer transaction');
        }
    }
}
