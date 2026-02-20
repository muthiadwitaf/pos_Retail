import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class ProductRepository {
    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) {
        const { where, ...rest } = params;
        return prisma.product.findMany({
            where: {
                ...where,
                deletedAt: null, // Global filter for soft delete
            },
            include: { category: true },
            ...rest,
        });
    }

    async count(where?: Prisma.ProductWhereInput) {
        return prisma.product.count({
            where: {
                ...where,
                deletedAt: null,
            },
        });
    }

    async findById(id: string) {
        return prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: { category: true },
        });
    }

    async findBySku(sku: string) {
        return prisma.product.findFirst({
            where: { sku, deletedAt: null },
        });
    }

    async findManyByIds(ids: string[]) {
        return prisma.product.findMany({
            where: {
                id: { in: ids },
                deletedAt: null
            }
        });
    }

    async create(data: Prisma.ProductCreateInput) {
        return prisma.product.create({
            data,
            include: { category: true },
        });
    }

    async update(id: string, data: Prisma.ProductUpdateInput) {
        return prisma.product.update({
            where: { id },
            data,
            include: { category: true },
        });
    }

    async softDelete(id: string) {
        return prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async updateStock(id: string, quantity: number, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return client.product.update({
            where: { id },
            data: {
                stock: {
                    increment: quantity
                }
            }
        });
    }
}
