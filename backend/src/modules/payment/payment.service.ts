import { CashPaymentStrategy } from './strategies/CashPaymentStrategy';
import { QrisPaymentStrategy } from './strategies/QrisPaymentStrategy';
import { PaymentStrategy, PaymentResult } from './strategies/PaymentStrategy';
import { AppError } from '../../common/errors/AppError';
import prisma from '../../config/prisma';

export class PaymentService {
    private strategies: Map<string, PaymentStrategy>;

    constructor() {
        this.strategies = new Map();
        this.strategies.set('CASH', new CashPaymentStrategy());
        this.strategies.set('QRIS', new QrisPaymentStrategy());
    }

    async processPayment(transactionId: string, method: string, data?: any): Promise<PaymentResult> {
        const strategy = this.strategies.get(method.toUpperCase());
        if (!strategy) {
            throw new AppError(`Payment method ${method} is not supported`, 400);
        }

        console.log(`Processing ${method} payment for transaction ${transactionId}`);
        return strategy.processPayment(transactionId, data);
    }

    async handleQrisWebhook(transactionId: string): Promise<void> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) throw new AppError('Transaction not found', 404);

        const trx = transaction as any;
        if (trx.paymentStatus === 'PAID') return;

        await prisma.transaction.update({
            where: { id: transactionId },
            data: { paymentStatus: 'PAID' } as any
        });

        console.log(`Webhook: Transaction ${transactionId} marked as PAID`);
    }

    async checkStatus(transactionId: string): Promise<{ status: string }> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) throw new AppError('Transaction not found', 404);

        const trx = transaction as any;
        return { status: trx.paymentStatus || 'PENDING' };
    }
}
