import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { StockService } from './stock.service';
import { v4 as uuidv4 } from 'uuid';

const stockService = new StockService();

interface CheckoutItem {
    productId: string;
    quantity: number;
    discount?: number;
}

interface PaymentData {
    amount: number;
    method: 'CASH' | 'QRIS' | 'TRANSFER';
}

export class TransactionService {
    async checkout(
        cashierId: string,
        items: CheckoutItem[],
        payment: PaymentData,
        discount: number = 0,
        tax: number = 0
    ) {
        if (items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        return await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const transactionItemsData = [];

            // 1. Process Items (Calculate totals and deduct stock)
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new AppError(`Product ${item.productId} not found`, 404);
                }

                const price = Number(product.price);
                const itemTotal = price * item.quantity - (item.discount || 0);
                subtotal += itemTotal;

                transactionItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: price,
                    discount: item.discount || 0
                });

                // Deduct Stock
                await stockService.updateStockWithTx(
                    tx,
                    item.productId,
                    'OUT',
                    item.quantity,
                    'Sale Transaction'
                );
            }

            // 2. Calculate Final Total
            // subtotal is sum of (price * qty - itemDiscount)
            // Transaction level discount/tax
            const totalAmount = subtotal - discount + tax;

            if (payment.amount < totalAmount) {
                throw new AppError(
                    `Insufficient payment. Total: ${totalAmount}, Paid: ${payment.amount}`,
                    400
                );
            }

            const change = payment.amount - totalAmount;

            // 3. Create Transaction Header
            // Generate readable code
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.transaction.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });
            const code = `TRX-${date}-${String(count + 1).padStart(3, '0')}`;

            const transaction = await tx.transaction.create({
                data: {
                    code,
                    subtotal,
                    discount,
                    tax,
                    totalAmount,
                    paymentMethod: payment.method,
                    cashierId,
                    items: {
                        create: transactionItemsData
                    }
                },
                include: { items: true }
            });

            // 4. Create Payment Record
            await tx.payment.create({
                data: {
                    transactionId: transaction.id,
                    amount: payment.amount,
                    method: payment.method,
                    change
                }
            });

            return { transaction, change };
        });
    }

    async getTransactions(query: { page?: number; limit?: number }) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    cashier: { select: { name: true } },
                    items: { include: { product: { select: { name: true, price: true } } } },
                    payment: true
                }
            }),
            prisma.transaction.count()
        ]);

        return {
            transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getTransactionById(id: string) {
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { items: { include: { product: true } }, payment: true, cashier: { select: { name: true } } }
        });

        if (!transaction) throw new AppError('Transaction not found', 404);
        return transaction;
    }
}
