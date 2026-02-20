import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

export class ProductService {
    async createProduct(data: {
        name: string;
        sku: string;
        barcode?: string;
        price: number;
        stock: number;
        categoryId: string;
        imageUrl?: string;
    }) {
        // Check if SKU exists
        const existingSku = await prisma.product.findUnique({
            where: { sku: data.sku },
        });
        if (existingSku) {
            throw new AppError('SKU already exists', 400);
        }

        // Check if Category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        return await prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                barcode: data.barcode,
                price: data.price,
                stock: data.stock,
                categoryId: data.categoryId,
                imageUrl: data.imageUrl,
            },
            include: { category: true },
        });
    }

    async getProducts(query: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
    }) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {
            deletedAt: null,
        };

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
                { barcode: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        if (query.categoryId) {
            where.categoryId = query.categoryId;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                take: limit,
                skip,
                include: { category: true },
                orderBy: { name: 'asc' },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProductById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!product || product.deletedAt) {
            throw new AppError('Product not found', 404);
        }

        return product;
    }

    async updateProduct(
        id: string,
        data: {
            name?: string;
            sku?: string;
            barcode?: string;
            price?: number;
            stock?: number;
            categoryId?: string;
            imageUrl?: string;
        }
    ) {
        const product = await this.getProductById(id);

        if (data.sku && data.sku !== product.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            });
            if (existingSku) {
                throw new AppError('SKU already exists', 400);
            }
        }

        return await prisma.product.update({
            where: { id },
            data,
            include: { category: true },
        });
    }

    async deleteProduct(id: string) {
        await this.getProductById(id);

        // Soft delete
        return await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
