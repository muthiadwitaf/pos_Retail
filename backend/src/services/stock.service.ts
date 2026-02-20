import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { StockMovementType } from '@prisma/client';

export class StockService {
    async getStockMovements(productId?: string) {
        const where = productId ? { productId } : {};
        return await prisma.stockMovement.findMany({
            where,
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async adjustStock(
        productId: string,
        type: StockMovementType,
        quantity: number,
        reason?: string
    ) {
        if (quantity <= 0) {
            throw new AppError('Quantity must be greater than 0', 400);
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        let newStock = product.stock;

        if (type === 'IN') {
            newStock += quantity;
        } else if (type === 'OUT') {
            if (product.stock < quantity) {
                throw new AppError('Insufficient stock', 400);
            }
            newStock -= quantity;
        } else if (type === 'ADJUSTMENT') {
            // Adjustment assumes 'quantity' is the DELTA or strict set?
            // Usually adjustment means "add or remove" or "set to". 
            // User requirement says "Manual stock adjustment".
            // Let's assume input quantity is the CHANGE amount.
            // If it's a set to specific value, we need to calculate delta.
            // Let's implement as "Add/Remove" via IN/OUT for simplicity, 
            // or if type is ADJUSTMENT, treats quantity as signed integer?
            // Type definition: IN, OUT, ADJUSTMENT.
            // Let's treat ADJUSTMENT as a correction. If positive add, if negative subtract.
            // But quantity is Int.

            // Let's stick to:
            // IN: Add
            // OUT: Subtract
            // ADJUSTMENT: Could be used for corrections. Let's assume it works like IN (if positive) or OUT (if negative logic is applied elsewhere).
            // Given the restrictions, I'll restrict ADJUSTMENT to be handled like IN (add) or OUT (deduct) but logged as ADJUSTMENT?

            // Actually, standard usually:
            // IN: Purchase, Return
            // OUT: Sale, Damage
            // ADJUSTMENT: Stocktake correction

            // I will handle ADUSTMENT based on header or explicit instruction.
            // For now, let's allow "Manual Stock IN" and "Manual Stock OUT".
            // If type is ADJUSTMENT, we need to know if we are adding or removing.
            // I will simplify: Admin sends IN/OUT/ADJUSTMENT and quantity.
            // If ADJUSTMENT, maybe they send positive/negative?
            // But quantity in schema is Int.

            // Let's allow simple IN/OUT for manual.
            // If type is ADJUSTMENT, I'll demand 'quantity' to be the absolute change, 
            // but I need to know direction.
            // Let's require the caller to specify effective change or just use IN/OUT.

            // I will support IN/OUT for explicit add/remove.
            // ADJUSTMENT will update the stock to match the provided quantity (Set Stock).
            // This is a common pattern for "Stocktake".

            if (type === 'ADJUSTMENT') {
                const delta = quantity - product.stock;
                newStock = quantity; // Set stock to exactly this amount
                // But stockMovement needs a quantity explaining the change.
                // So we record the delta.
            }
        }

        // Since schema has "quantity" as Int, I should store the delta or the absolute amount?
        // "quantity" in stockMovement usually refers to the amount moved.

        // Let's refine:
        // Manual Add -> Type IN, Qty 10 -> Stock + 10
        // Manual Deduct -> Type OUT, Qty 5 -> Stock - 5
        // Stocktake -> Type ADJUSTMENT, Qty 50 (new balance) -> Stock = 50. Delta = 50 - current.

        // I will implement "Add" and "Deduct" endpoints which map to IN/OUT.
    }

    async updateStockWithTx(
        tx: any,
        productId: string,
        type: 'IN' | 'OUT',
        quantity: number,
        reason?: string
    ) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError('Product not found', 404);

        let newStock = product.stock;
        if (type === 'IN') {
            newStock += quantity;
        } else {
            if (product.stock < quantity) throw new AppError(`Insufficient stock for product ${product.name}`, 400);
            newStock -= quantity;
        }

        const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: { stock: newStock },
        });

        await tx.stockMovement.create({
            data: {
                productId,
                type: type as StockMovementType,
                quantity,
                reason,
            },
        });

        return updatedProduct;
    }

    async updateStock(
        productId: string,
        type: 'IN' | 'OUT',
        quantity: number,
        reason?: string
    ) {
        return await prisma.$transaction(async (tx) => {
            return this.updateStockWithTx(tx, productId, type, quantity, reason);
        });
    }
}
