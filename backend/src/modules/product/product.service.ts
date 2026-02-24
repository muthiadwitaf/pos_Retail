import { ProductRepository } from './product.repository';
import { StockRepository } from '../stock/stock.repository';
import { AppError } from '../../common/errors/AppError';
import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class ProductService {
    private productRepository: ProductRepository;
    private stockRepository: StockRepository;

    constructor() {
        this.productRepository = new ProductRepository();
        this.stockRepository = new StockRepository();
    }

    async getAllProducts(query: { search?: string; categoryId?: string; page?: number; limit?: number }) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {};
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
            this.productRepository.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.productRepository.count(where),
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

    async getProduct(id: string) {
        const product = await this.productRepository.findById(id);
        if (!product) throw new AppError('Product not found', 404);
        return product;
    }

    async createProduct(data: any) {
        const existing = await this.productRepository.findBySku(data.sku);
        if (existing) throw new AppError('SKU already exists', 400);

        const initialStock = data.stock || 0;

        // Use transaction to create product + stock movement atomically
        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data,
                include: { category: true },
            });

            // Record initial stock movement if stock > 0
            if (initialStock > 0) {
                await this.stockRepository.createMovement({
                    productId: created.id,
                    type: 'IN',
                    quantity: initialStock,
                    reason: 'Initial stock - product created',
                }, tx);
            }

            return created;
        });

        return product;
    }

    async updateProduct(id: string, data: any) {
        const currentProduct = await this.getProduct(id);
        if (data.sku) {
            const existing = await this.productRepository.findBySku(data.sku);
            if (existing && existing.id !== id) throw new AppError('SKU already exists', 400);
        }

        // Track stock changes
        const newStock = data.stock !== undefined ? Number(data.stock) : null;
        const oldStock = currentProduct.stock;

        const product = await prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({
                where: { id },
                data,
                include: { category: true },
            });

            // Record stock movement if stock changed
            if (newStock !== null && newStock !== oldStock) {
                const diff = newStock - oldStock;
                await this.stockRepository.createMovement({
                    productId: id,
                    type: diff > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(diff),
                    reason: diff > 0
                        ? `Stock increased from ${oldStock} to ${newStock}`
                        : `Stock decreased from ${oldStock} to ${newStock}`,
                }, tx);
            }

            return updated;
        });

        return product;
    }

    async deleteProduct(id: string) {
        await this.getProduct(id);
        return this.productRepository.softDelete(id);
    }
}

