import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
    constructor(private prisma: PrismaService) { }

    async create(createLocationDto: CreateLocationDto) {
        const existingLocation = await this.prisma.location.findUnique({
            where: { bin_code: createLocationDto.bin_code },
        });

        if (existingLocation) {
            throw new ConflictException(`Location with bin code ${createLocationDto.bin_code} already exists`);
        }

        return this.prisma.location.create({
            data: createLocationDto,
        });
    }

    findAll() {
        return this.prisma.location.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const location = await this.prisma.location.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    async update(id: number, updateLocationDto: UpdateLocationDto) {
        await this.findOne(id);

        if (updateLocationDto.bin_code) {
            const existingLocation = await this.prisma.location.findUnique({
                where: { bin_code: updateLocationDto.bin_code },
            });

            if (existingLocation && existingLocation.id !== id) {
                throw new ConflictException(`Location with bin code ${updateLocationDto.bin_code} already exists`);
            }
        }

        return this.prisma.location.update({
            where: { id },
            data: updateLocationDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);

        const relatedStocks = await this.prisma.stock.findFirst({
            where: { locationId: id }
        });

        if (relatedStocks) {
            throw new ConflictException(`Cannot delete location with existing stock`);
        }

        return this.prisma.location.delete({
            where: { id },
        });
    }
}
