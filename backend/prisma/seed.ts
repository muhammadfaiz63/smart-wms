import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log('Seeding database...');

    // 1. Seed Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@smartwms.com' },
        update: {},
        create: {
            email: 'admin@smartwms.com',
            name: 'Administrator',
            password: await bcrypt.hash('smartwmsadmin01!', 10),
            role: Role.ADMIN,
        },
    });

    const staff1 = await prisma.user.upsert({
        where: { email: 'staff1@smartwms.com' },
        update: {},
        create: {
            email: 'staff1@smartwms.com',
            name: 'Warehouse Staff 1',
            password: await bcrypt.hash('smartwmsstaff01!', 10),
            role: Role.STAFF,
        },
    });

    const staff2 = await prisma.user.upsert({
        where: { email: 'staff2@smartwms.com' },
        update: {},
        create: {
            email: 'staff2@smartwms.com',
            name: 'Warehouse Staff 2',
            password: await bcrypt.hash('smartwmsstaff02!', 10),
            role: Role.STAFF,
        },
    });

    console.log('Users seeded');

    // 2. Seed Master Data: Products
    const products = [
        { sku: 'ITM-001', name: 'Laptop ThinkPad X1', unit: 'pcs' },
        { sku: 'ITM-002', name: 'Wireless Mouse Logitech MX', unit: 'pcs' },
        { sku: 'ITM-003', name: 'Mechanical Keyboard Keychron', unit: 'pcs' },
        { sku: 'ITM-004', name: 'Monitor Dell 27 inch', unit: 'pcs' },
        { sku: 'ITM-005', name: 'USB-C Cable 2 Meter', unit: 'pcs' },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { sku: product.sku },
            update: {},
            create: product,
        });
    }

    console.log('Products seeded');

    // 3. Seed Master Data: Locations (Bins)
    const locations = [
        { bin_code: 'INBOUND-01', zone: 'RECEIVING' },
        { bin_code: 'A1-01', zone: 'STORAGE' },
        { bin_code: 'A1-02', zone: 'STORAGE' },
        { bin_code: 'B1-01', zone: 'STORAGE' },
        { bin_code: 'QUAR-01', zone: 'QUARANTINE' },
        { bin_code: 'OUTBOUND-01', zone: 'DISPATCH' },
    ];

    for (const location of locations) {
        await prisma.location.upsert({
            where: { bin_code: location.bin_code },
            update: {},
            create: location,
        });
    }

    console.log('Locations seeded');
    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
