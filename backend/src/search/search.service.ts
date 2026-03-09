import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async searchGlobal(query: string, userRole: string) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const safeQuery = query.trim();

        const [products, locations, users, stocks] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: safeQuery, mode: 'insensitive' } },
                        { sku: { contains: safeQuery, mode: 'insensitive' } },
                    ]
                },
                take: 5,
            }),
            this.prisma.location.findMany({
                where: {
                    OR: [
                        { bin_code: { contains: safeQuery, mode: 'insensitive' } },
                        { zone: { contains: safeQuery, mode: 'insensitive' } },
                    ]
                },
                take: 5,
            }),
            userRole === 'ADMIN' ? this.prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: safeQuery, mode: 'insensitive' } },
                        { email: { contains: safeQuery, mode: 'insensitive' } },
                    ]
                },
                take: 5,
            }) : Promise.resolve([]) as Promise<any[]>,
            this.prisma.stock.findMany({
                where: {
                    batch_no: { contains: safeQuery, mode: 'insensitive' }
                },
                include: {
                    product: true,
                    location: true
                },
                take: 5,
            })
        ]);

        const results: Array<{ id: string; type: string; title: string | null; subtitle: string; url: string }> = [];

        products.forEach(p => {
            results.push({
                id: `product-${p.id}`,
                type: 'Product',
                title: p.name,
                subtitle: `SKU: ${p.sku} | Unit: ${p.unit}`,
                url: `/master/products`
            });
        });

        locations.forEach(l => {
            results.push({
                id: `location-${l.id}`,
                type: 'Location',
                title: l.bin_code,
                subtitle: `Zone: ${l.zone}`,
                url: `/master/locations`
            });
        });

        users.forEach(u => {
            results.push({
                id: `user-${u.id}`,
                type: 'User',
                title: u.name,
                subtitle: `Email: ${u.email} | Role: ${u.role}`,
                url: `/master/users`
            });
        });

        stocks.forEach(s => {
            results.push({
                id: `stock-${s.id}`,
                type: 'Stock (Batch)',
                title: s.batch_no,
                subtitle: `Product: ${s.product.name} | Bin: ${s.location.bin_code}`,
                url: `/inventory?search=${encodeURIComponent(s.batch_no)}`
            });
        });

        return results;
    }
}
