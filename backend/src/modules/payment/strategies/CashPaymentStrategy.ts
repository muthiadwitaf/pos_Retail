import prisma from '../../../config/prisma';
import { PaymentStrategy, PaymentResult } from './PaymentStrategy';
import { AppError } from '../../../common/errors/AppError';

export class CashPaymentStrategy implements PaymentStrategy {
    async processPayment(transactionId: string, data: { paidAmount: number }): Promise<PaymentResult> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { items: { include: { product: true } }, cashier: true }
        });

        if (!transaction) throw new AppError('Transaction not found', 404);

        const trx = transaction as any;
        if (trx.paymentStatus === 'PAID') throw new AppError('Transaction already paid', 400);

        const total = Number(transaction.totalAmount);
        if (data.paidAmount < total) {
            throw new AppError('Paid amount is less than total amount', 400);
        }

        const change = data.paidAmount - total;

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                paymentStatus: 'PAID',
                paidAmount: data.paidAmount,
                changeAmount: change
            } as any
        });

        return {
            status: 'PAID',
            changeAmount: change,
            receiptData: {
                code: transaction.code,
                date: transaction.createdAt,
                items: transaction.items.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: Number(item.price),
                    total: Number(item.price) * item.quantity
                })),
                subtotal: Number(trx.subtotal),
                tax: Number(trx.tax),
                total: total,
                paidAmount: data.paidAmount,
                change: change,
                cashier: transaction.cashier.name,
                paymentMethod: 'CASH'
            }
        };
    }
}
