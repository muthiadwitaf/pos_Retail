import { TransactionService } from '../modules/transaction/transaction.service';
import { prismaMock } from './setup';
import { AppError } from '../common/errors/AppError';
import { Prisma } from '@prisma/client';

describe('TransactionService', () => {
    let service: TransactionService;

    beforeEach(() => {
        service = new TransactionService();
    });

    it('should throw error if cart is empty', async () => {
        await expect(service.checkout('cashier-1', {
            items: [],
            paymentMethod: 'CASH',
            paymentAmount: 0
        })).rejects.toThrow('Cart cannot be empty');
    });

    it('should throw error if stock is insufficient', async () => {
        // Mock finding products
        (service as any).productRepository.findManyByIds = jest.fn().mockResolvedValue([
            { id: 'p1', name: 'Product 1', price: new Prisma.Decimal(100), stock: 5 }
        ]);

        await expect(service.checkout('cashier-1', {
            items: [{ productId: 'p1', quantity: 10 }],
            paymentMethod: 'CASH',
            paymentAmount: 1000
        })).rejects.toThrow('Insufficient stock for Product 1');
    });

    it('should throw error if payment is insufficient', async () => {
        (service as any).productRepository.findManyByIds = jest.fn().mockResolvedValue([
            { id: 'p1', name: 'Product 1', price: new Prisma.Decimal(100), stock: 20 }
        ]);

        await expect(service.checkout('cashier-1', {
            items: [{ productId: 'p1', quantity: 1 }],
            paymentMethod: 'CASH',
            paymentAmount: 50 // Total will be 100 + tax (10) = 110
        })).rejects.toThrow('Insufficient payment amount');
    });
});
