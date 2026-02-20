// Local type to avoid stale Prisma client cache issues in IDE
export type PaymentStatusType = 'PENDING' | 'PAID' | 'FAILED';

export interface PaymentResult {
    status: PaymentStatusType;
    changeAmount?: number;
    qrCodeUrl?: string;
    expiredAt?: Date;
    receiptData?: any;
}

export interface PaymentStrategy {
    processPayment(transactionId: string, data?: any): Promise<PaymentResult>;
}
