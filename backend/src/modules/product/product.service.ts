import { ProductRepository } from './product.repository';
import { AppError } from '../../common/errors/AppError';
import { Prisma } from '@prisma/client';

export class ProductService {
    private productRepository: ProductRepository;

    constructor() {
        this.productRepository = new ProductRepository();
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

        return this.productRepository.create(data);
    }

    async updateProduct(id: string, data: any) {
        await this.getProduct(id);
        if (data.sku) {
            const existing = await this.productRepository.findBySku(data.sku);
            if (existing && existing.id !== id) throw new AppError('SKU already exists', 400);
        }
        return this.productRepository.update(id, data);
    }

    async deleteProduct(id: string) {
        await this.getProduct(id);
        return this.productRepository.softDelete(id);
    }
}
