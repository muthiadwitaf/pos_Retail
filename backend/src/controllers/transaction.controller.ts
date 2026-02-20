import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AppError } from '../utils/AppError';

const transactionService = new TransactionService();

export const checkout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { items, payment, discount, tax } = req.body;

        if (!req.user) return next(new AppError('Not authenticated', 401));

        const result = await transactionService.checkout(
            req.user.id,
            items,
            payment,
            discount,
            tax
        );
        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page, limit } = req.query;
        const result = await transactionService.getTransactions({
            page: Number(page) || 1,
            limit: Number(limit) || 10
        });
        // Wrap in `data` field to match the standard API response shape
        // Frontend reads: response.data.data.transactions & response.data.data.meta
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
}

export const getTransactionById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const transaction = await transactionService.getTransactionById(req.params.id as string);
        res.status(200).json({ status: 'success', data: { transaction } });
    } catch (error) {
        next(error);
    }
}
