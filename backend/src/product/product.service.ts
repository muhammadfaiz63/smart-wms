import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto) {
        const existingProduct = await this.prisma.product.findUnique({
            where: { sku: createProductDto.sku },
        });

        if (existingProduct) {
            throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
        }

        return this.prisma.product.create({
            data: createProductDto,
        });
    }

    findAll() {
        return this.prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        await this.findOne(id); // Ensure it exists

        if (updateProductDto.sku) {
            const existingProduct = await this.prisma.product.findUnique({
                where: { sku: updateProductDto.sku },
            });

            if (existingProduct && existingProduct.id !== id) {
                throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
            }
        }

        return this.prisma.product.update({
            where: { id },
            data: updateProductDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Ensure it exists

        // Check for related stocks or transactions before deleting
        const relatedStocks = await this.prisma.stock.findFirst({
            where: { productId: id }
        });

        if (relatedStocks) {
            throw new ConflictException(`Cannot delete product with existing stock`);
        }

        return this.prisma.product.delete({
            where: { id },
        });
    }
}
