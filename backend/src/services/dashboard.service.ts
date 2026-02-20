import prisma from '../utils/prisma';

export class DashboardService {
    async getStats() {
        const [
            totalRevenue,
            transactionCount,
            lowStockCount,
            activeProductsCount,
        ] = await Promise.all([
            // Total Revenue
            prisma.transaction.aggregate({
                _sum: {
                    totalAmount: true,
                },
            }),
            // Total Transactions
            prisma.transaction.count(),
            // Low Stock Items (threshold: 10)
            prisma.product.count({
                where: {
                    stock: {
                        lte: 10,
                    },
                    deletedAt: null,
                },
            }),
            // Active Products
            prisma.product.count({
                where: {
                    deletedAt: null,
                },
            }),
        ]);

        // Recent Transactions (last 5)
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                cashier: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return {
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
            transactionCount,
            lowStockCount,
            activeProductsCount,
            recentTransactions,
        };
    }
}
