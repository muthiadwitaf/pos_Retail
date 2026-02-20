import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting massive seeding process...');

    // 1. Clear existing data in correct order (EXCEPT Users to keep session/accounts)
    await prisma.stockMovement.deleteMany();
    await prisma.transactionItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    // await prisma.user.deleteMany(); // STOP deleting users
    console.log('✅ Catalog data cleared (Users preserved).');

    // 2. Upsert Admin (Update if exists, Create if not)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Administrator',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user secured.');

    // 3. Define Hierarchy Structure (Alfagift.id Style)
    const categoryTree = [
        {
            name: 'Makanan',
            image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
            sub: [
                { name: 'Mie Instan', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400' },
                { name: 'Snack & Keripik', image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400' },
                { name: 'Biskuit & Wafer', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
                { name: 'Cokelat & Permen', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400' },
                { name: 'Sarapan & Sereal', image: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400' }
            ]
        },
        {
            name: 'Minuman',
            image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
            sub: [
                { name: 'Air Mineral', image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400' },
                { name: 'Teh', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
                { name: 'Kopi', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400' },
                { name: 'Susu', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
                { name: 'Minuman Berkarbonasi', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
                { name: 'Jus & Minuman Buah', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400' }
            ]
        },
        {
            name: 'Kebutuhan Dapur',
            image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
            sub: [
                { name: 'Minyak Goreng', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
                { name: 'Beras', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
                { name: 'Bumbu & Sambal', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
                { name: 'Gula & Garam', image: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400' },
                { name: 'Makanan Kaleng', image: 'https://images.unsplash.com/photo-1597227913587-f832b2c8f586?w=400' }
            ]
        },
        {
            name: 'Produk Segar & Beku',
            image: 'https://images.unsplash.com/photo-1562967914-6c6a7e89ddb3?w=400',
            sub: [
                { name: 'Daging & Seafood', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400' },
                { name: 'Telur', image: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400' },
                { name: 'Sayur & Buah', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400' },
                { name: 'Makanan Beku', image: 'https://images.unsplash.com/photo-1562967914-6c6a7e89ddb3?w=400' },
                { name: 'Es Krim', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dabb892?w=400' }
            ]
        },
        {
            name: 'Personal Care',
            image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d52d?w=400',
            sub: [
                { name: 'Sabun & Body Wash', image: 'https://images.unsplash.com/photo-1600857062241-99e5daec63cc?w=400' },
                { name: 'Sampo', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400' },
                { name: 'Perawatan Wajah', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
                { name: 'Deodoran', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400' },
                { name: 'Perawatan Gigi', image: 'https://images.unsplash.com/photo-1606778431871-92b1979b9087?w=400' }
            ]
        },
        {
            name: 'Kebutuhan Rumah',
            image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400',
            sub: [
                { name: 'Deterjen', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400' },
                { name: 'Pembersih Lantai', image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400' },
                { name: 'Tisu', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' },
                { name: 'Pembasmi Serangga', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' },
                { name: 'Perlengkapan Alat Tulis', image: 'https://images.unsplash.com/photo-1585336139118-132f70e456de?w=400' }
            ]
        },
        {
            name: 'Kebutuhan Kesehatan',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
            sub: [
                { name: 'Vitamin & Suplemen', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' },
                { name: 'Obat-obatan', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=400' },
                { name: 'Perawatan Luka', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' }
            ]
        },
        {
            name: 'Kebutuhan Ibu & Anak',
            image: 'https://images.unsplash.com/photo-1515224526905-51c7d77c7bb8?w=400',
            sub: [
                { name: 'Susu Bayi', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
                { name: 'Popok Bayi', image: 'https://images.unsplash.com/photo-1522771917714-d73737373c33?w=400' },
                { name: 'Makanan Bayi', image: 'https://images.unsplash.com/photo-1515224526905-51c7d77c7bb8?w=400' }
            ]
        }
    ];

    // 4. Seeding Logic
    let totalProducts = 0;
    const targetProducts = 1000;

    for (const parent of categoryTree) {
        // Create Parent Category
        const parentCat = await prisma.category.create({
            data: { name: parent.name, imageUrl: parent.image } as any
        });
        console.log(`📂 Created Main Category: ${parent.name}`);

        for (const sub of parent.sub) {
            // Create Sub Category
            const subCat = await prisma.category.create({
                data: { name: sub.name, imageUrl: sub.image, parentId: parentCat.id } as any
            });

            // Generate Products for this Sub Category
            const subCategoryProducts = generateBaseProductsForSub(sub.name);

            for (const base of subCategoryProducts) {
                // Variations (Size/Flavor)
                const variants = getVariantsForProductType(sub.name);

                for (const variant of variants) {
                    if (totalProducts >= targetProducts + 50) break; // Buffer

                    const fullName = `${base.brand} ${base.name} ${variant.spec}`;
                    const sku = `${base.brand.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 90000) + 10000}-${variant.code}`;

                    await prisma.product.create({
                        data: {
                            name: fullName,
                            sku: sku,
                            price: base.basePrice + variant.priceDiff,
                            stock: Math.floor(Math.random() * 500) + 50,
                            imageUrl: base.imageUrl,
                            categoryId: subCat.id
                        }
                    });
                    totalProducts++;
                }
                if (totalProducts >= targetProducts + 50) break;
            }
        }
    }

    console.log(`✅ Seeding complete! Total products created: ${totalProducts}`);
}

// Helper: Base product templates for each subcategory
function generateBaseProductsForSub(subName: string) {
    const images = {
        food: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300',
        bev: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300',
        kitchen: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300',
        personal: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d52d?w=300',
        house: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300',
        health: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
        baby: 'https://images.unsplash.com/photo-1515224526905-51c7d77c7bb8?w=300'
    };

    if (subName === 'Mie Instan') {
        return [
            { brand: 'Indomie', name: 'Mi Instan', basePrice: 3500, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300' },
            { brand: 'Sedaap', name: 'Mi Instan', basePrice: 3200, imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300' },
            { brand: 'Sarimi', name: 'Mi Instan', basePrice: 3000, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
            { brand: 'Pop Mie', name: 'Cup', basePrice: 5000, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300' }
        ];
    }
    if (subName === 'Snack & Keripik') {
        return [
            { brand: 'Chitato', name: 'Potato Chips', basePrice: 12000, imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300' },
            { brand: 'Lays', name: 'Potato Chips', basePrice: 12000, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
            { brand: 'Taro', name: 'Net Snack', basePrice: 8000, imageUrl: 'https://images.unsplash.com/photo-1548940392-6b8ecc37b9e6?w=300' },
            { brand: 'Qtela', name: 'Keripik Singkong', basePrice: 7000, imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300' },
            { brand: 'Pringles', name: 'Can', basePrice: 22000, imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300' }
        ];
    }
    if (subName === 'Air Mineral') {
        return [
            { brand: 'Aqua', name: 'Air Mineral', basePrice: 4000, imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300' },
            { brand: 'Le Minerale', name: 'Air Mineral', basePrice: 3500, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300' },
            { brand: 'Ades', name: 'Air Mineral', basePrice: 3800, imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300' },
            { brand: 'Viro', name: 'Air Mineral', basePrice: 3000, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300' }
        ];
    }
    if (subName === 'Sabun & Body Wash') {
        return [
            { brand: 'Lifebuoy', name: 'Body Wash', basePrice: 25000, imageUrl: 'https://images.unsplash.com/photo-1600857062241-99e5daec63cc?w=300' },
            { brand: 'Dettol', name: 'Body Wash', basePrice: 30000, imageUrl: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=300' },
            { brand: 'Biore', name: 'Body Wash', basePrice: 28000, imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
            { brand: 'Lux', name: 'Body Wash', basePrice: 22000, imageUrl: 'https://images.unsplash.com/photo-1600857062241-99e5daec63cc?w=300' }
        ];
    }
    if (subName === 'Deterjen') {
        return [
            { brand: 'Rinso', name: 'Deterjen Bubuk', basePrice: 18000, imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300' },
            { brand: 'Attack', name: 'Deterjen Bubuk', basePrice: 20000, imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300' },
            { brand: 'So Klin', name: 'Deterjen Bubuk', basePrice: 16000, imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300' },
            { brand: 'Daia', name: 'Deterjen Bubuk', basePrice: 14000, imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300' }
        ];
    }

    // Generic generator for other subcategories to reach count
    const genericBrands = ['Unilever', 'P&G', 'Wings', 'Mayora', 'ABC', 'Nestle', 'Danone', 'Indofood', 'Kao', 'Johnson & Johnson'];
    const brand = genericBrands[Math.floor(Math.random() * genericBrands.length)];
    const imgKey = subName.toLowerCase().includes('minum') ? 'bev' :
        subName.toLowerCase().includes('makan') ? 'food' :
            subName.toLowerCase().includes('dapur') ? 'kitchen' :
                subName.toLowerCase().includes('rumah') ? 'house' : 'personal';

    return Array.from({ length: 6 }).map((_, i) => ({
        brand: `${brand} ${i + 1}`,
        name: subName,
        basePrice: Math.floor(Math.random() * 50000) + 5000,
        imageUrl: (images as any)[imgKey] || images.food
    }));
}

// Helper: Variants (flavor/size) for product types
function getVariantsForProductType(subName: string) {
    if (subName === 'Mie Instan') {
        return [
            { spec: 'Goreng Original 85g', code: 'V1', priceDiff: 0 },
            { spec: 'Kuah Soto 75g', code: 'V2', priceDiff: -200 },
            { spec: 'Kuah Ayam Bawang 75g', code: 'V3', priceDiff: -200 },
            { spec: 'Goreng Pedas 80g', code: 'V4', priceDiff: 300 },
            { spec: 'Kari Ayam 80g', code: 'V5', priceDiff: 500 },
            { spec: 'Rendang 85g', code: 'V6', priceDiff: 600 }
        ];
    }
    if (subName === 'Air Mineral') {
        return [
            { spec: '240ml Cup', code: 'S1', priceDiff: -3000 },
            { spec: '330ml Pet', code: 'S2', priceDiff: -1000 },
            { spec: '600ml Pet', code: 'S3', priceDiff: 0 },
            { spec: '1500ml Pet', code: 'S4', priceDiff: 4000 },
            { spec: '5L Galon', code: 'S5', priceDiff: 15000 }
        ];
    }
    if (subName === 'Sabun & Body Wash' || subName === 'Sampo') {
        return [
            { spec: '80ml Sachet Pack', code: 'P1', priceDiff: -15000 },
            { spec: '170ml Bottle', code: 'P2', priceDiff: -5000 },
            { spec: '400ml Pouch Refill', code: 'P3', priceDiff: 5000 },
            { spec: '450ml Pump Bottle', code: 'P4', priceDiff: 15000 }
        ];
    }
    // Default variations for everything else
    return [
        { spec: 'Small Pack', code: 'G1', priceDiff: -2000 },
        { spec: 'Regular Pack', code: 'G2', priceDiff: 0 },
        { spec: 'Family Pack', code: 'G3', priceDiff: 8000 },
        { spec: 'Economy Pack', code: 'G4', priceDiff: 15000 },
        { spec: 'Variant A', code: 'G5', priceDiff: 100 },
        { spec: 'Variant B', code: 'G6', priceDiff: 200 }
    ];
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
