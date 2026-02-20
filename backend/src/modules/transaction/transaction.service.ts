import prisma from '../../config/prisma';
import { TransactionRepository } from './transaction.repository';
import { ProductRepository } from '../product/product.repository';
import { StockRepository } from '../stock/stock.repository';
import { AppError } from '../../common/errors/AppError';
import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

export class TransactionService {
    private transactionRepository: TransactionRepository;
    private productRepository: ProductRepository;
    private stockRepository: StockRepository;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.productRepository = new ProductRepository();
        this.stockRepository = new StockRepository();
    }

    async checkout(cashierId: string, data: {
        items: { productId: string; quantity: number }[];
        paymentMethod: string;
        paymentAmount?: number;
        taxRate?: number;
    }) {
        if (!data.items || data.items.length === 0) {
            throw new AppError('Cart cannot be empty', 400);
        }

        // 1. Bulk Fetch Products
        const productIds = data.items.map(item => item.productId);
        const products = await this.productRepository.findManyByIds(productIds);
        const productMap = new Map(products.map(p => [p.id, p]));

        // 2. Validate Items & Calculate Totals
        let subtotal = new Prisma.Decimal(0);
        const transactionItemsData: any[] = [];
        const stockUpdates: any[] = [];

        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
            if (product.stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);

            const itemPrice = product.price;
            subtotal = subtotal.add(itemPrice.mul(item.quantity));

            transactionItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: itemPrice,
                discount: new Prisma.Decimal(0),
            });

            stockUpdates.push({ productId: product.id, quantity: -item.quantity });
        }

        const taxRate = data.taxRate || 0.11; // 11% tax
        const taxAmount = subtotal.mul(taxRate);
        const totalAmount = subtotal.add(taxAmount);

        // Handling payment logic
        const paymentMethod = data.paymentMethod.toUpperCase();
        const paymentStatus = 'PENDING'; // Always PENDING — payment strategy will mark as PAID
        let paidAmount = data.paymentAmount || 0;
        let change = 0;

        if (paymentMethod === 'CASH' && data.paymentAmount) {
            change = Math.max(0, data.paymentAmount - Number(totalAmount));
        }

        // 3. Execute Transaction
        const tranCode = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(5).toUpperCase()}`;

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create Transaction with new fields
            const transaction = await tx.transaction.create({
                data: {
                    code: tranCode,
                    subtotal,
                    tax: taxAmount,
                    totalAmount,
                    paymentMethod,
                    paymentStatus,
                    paidAmount,
                    changeAmount: change,
                    cashier: { connect: { id: cashierId } }
                } as any,
                include: { items: true }
            });

            // Create Transaction Items
            await tx.transactionItem.createMany({
                data: transactionItemsData.map(item => ({ ...item, transactionId: transaction.id }))
            });

            // Update Stock
            for (const update of stockUpdates) {
                await tx.product.update({
                    where: { id: update.productId },
                    data: { stock: { increment: update.quantity } }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: update.productId,
                        type: 'OUT',
                        quantity: Math.abs(update.quantity),
                        reason: `Transaction ${tranCode}`
                    }
                });
            }

            return transaction;
        });
    }

    async getHistory(params: any) {
        const [transactions, total] = await Promise.all([
            this.transactionRepository.findAll(params),
            this.transactionRepository.count()
        ]);
        return { transactions, total };
    }
}
