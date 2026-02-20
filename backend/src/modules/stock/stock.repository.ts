import prisma from '../../config/prisma';
import { Prisma, StockMovementType } from '@prisma/client';

export class StockRepository {
    async createMovement(data: {
        productId: string;
        type: StockMovementType;
        quantity: number;
        reason?: string;
    }, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return client.stockMovement.create({
            data,
        });
    }

    async getHistory(productId?: string) {
        return prisma.stockMovement.findMany({
            where: productId ? { productId } : {},
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
