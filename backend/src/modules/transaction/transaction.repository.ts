import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class TransactionRepository {
    async create(data: Prisma.TransactionCreateInput, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return client.transaction.create({
            data,
            include: { items: true, payment: true },
        });
    }

    async createItems(data: Prisma.TransactionItemCreateManyInput[], tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return client.transactionItem.createMany({
            data,
        });
    }

    async createPayment(data: Prisma.PaymentUncheckedCreateInput, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return client.payment.create({
            data,
        });
    }

    async findAll(params: any) {
        return prisma.transaction.findMany({
            include: { cashier: { select: { name: true } }, items: { include: { product: true } }, payment: true },
            orderBy: { createdAt: 'desc' },
            ...params,
        });
    }

    async findById(id: string) {
        return prisma.transaction.findUnique({
            where: { id },
            include: { cashier: true, items: { include: { product: true } }, payment: true },
        });
    }

    async count() {
        return prisma.transaction.count();
    }
}
