import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class DashboardService {
    async getStats() {
        const [
            totalTransactions,
            totalProducts,
            totalCategories,
            salesData,
            lowStockCount
        ] = await Promise.all([
            prisma.transaction.count(),
            prisma.product.count({ where: { deletedAt: null } }),
            prisma.category.count(),
            prisma.transaction.aggregate({
                _sum: {
                    totalAmount: true
                }
            }),
            prisma.product.count({
                where: {
                    deletedAt: null,
                    stock: { lte: 10 }
                }
            })
        ]);

        return {
            totalTransactions,
            totalProducts,
            totalCategories,
            totalRevenue: Number(salesData._sum.totalAmount || 0),
            lowStockCount
        };
    }

    async getChartData() {
        // 1. Sales per Category (Doughnut chart)
        let salesByCategory: { category: string; total: number }[] = [];
        let salesByHour: { hour: number; total: number; count: number }[] = [];
        let salesByMonth: { month: string; total: number; count: number }[] = [];

        try {
            const rawCategory = await prisma.$queryRaw<any[]>`
                SELECT 
                    cat_name as category,
                    SUM(item_total) as total
                FROM (
                    SELECT 
                        COALESCE(parent.name, c.name, 'Uncategorized') as cat_name,
                        ti.price * ti.quantity as item_total
                    FROM transaction_items ti
                    JOIN products p ON ti.product_id = p.id
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN categories parent ON c.parent_id = parent.id
                ) sub
                GROUP BY cat_name
                ORDER BY total DESC
                LIMIT 10
            `;
            salesByCategory = rawCategory.map(r => ({
                category: r.category,
                total: Number(r.total)
            }));
        } catch (e) {
            console.error('Chart: salesByCategory query failed', e);
        }

        try {
            // 2. Sales per Hour (Bar chart - today in WIB/Jakarta timezone)
            // Double AT TIME ZONE needed: first declares stored value is UTC, second converts to Jakarta
            const rawHour = await prisma.$queryRaw<any[]>`
                SELECT 
                    EXTRACT(HOUR FROM t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') as hour,
                    COALESCE(SUM(t.total_amount), 0) as total,
                    COUNT(*) as count
                FROM transactions t
                WHERE (t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
                GROUP BY hour
                ORDER BY hour
            `;
            salesByHour = rawHour.map(r => ({
                hour: Number(r.hour),
                total: Number(r.total),
                count: Number(r.count)
            }));
        } catch (e) {
            console.error('Chart: salesByHour query failed', e);
        }

        try {
            // 3. Sales per Month (Line chart - last 12 months)
            const rawMonth = await prisma.$queryRaw<any[]>`
                SELECT 
                    TO_CHAR(t.created_at, 'YYYY-MM') as month,
                    COALESCE(SUM(t.total_amount), 0) as total,
                    COUNT(*) as count
                FROM transactions t
                WHERE t.created_at >= NOW() - INTERVAL '12 months'
                GROUP BY month
                ORDER BY month
            `;
            salesByMonth = rawMonth.map(r => ({
                month: r.month,
                total: Number(r.total),
                count: Number(r.count)
            }));
        } catch (e) {
            console.error('Chart: salesByMonth query failed', e);
        }

        return {
            salesByCategory,
            salesByHour,
            salesByMonth
        };
    }

}
