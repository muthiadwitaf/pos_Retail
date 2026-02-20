import prisma from '../../../config/prisma';
import { PaymentStrategy, PaymentResult } from './PaymentStrategy';
import { AppError } from '../../../common/errors/AppError';

export class QrisPaymentStrategy implements PaymentStrategy {
    async processPayment(transactionId: string): Promise<PaymentResult> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) throw new AppError('Transaction not found', 404);

        const trx = transaction as any;
        if (trx.paymentStatus === 'PAID') throw new AppError('Transaction already paid', 400);

        // Mock QRIS Generation
        // In a real system, we would integrate with a payment gateway (Midtrans, Xendit, etc.)
        const qrContent = `00020101021226580010ID.CO.QRIS.WWW0215ID10202101037510303UMI51440014ID.CO.QRIS.WWW0215ID10202101037510303UMI5204541153033605802ID5908MAJOO_POS6007JAKARTA61051234562070703A016304`;
        const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}&color=2367F6`;

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15); // Expire in 15 mins

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                paymentStatus: 'PENDING',
                paymentMethod: 'QRIS',
                qrCodeUrl: mockQrUrl
            } as any
        });

        return {
            status: 'PENDING',
            qrCodeUrl: mockQrUrl,
            expiredAt: expiry
        };
    }
}
