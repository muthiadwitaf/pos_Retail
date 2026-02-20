import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service';
import { AppError } from '../utils/AppError';

const stockService = new StockService();

export const getStockMovements = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.query;
        const movements = await stockService.getStockMovements(productId as string);
        res.status(200).json({ status: 'success', data: { movements } });
    } catch (error) {
        next(error);
    }
};

export const updateStock = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId, type, Kquantity, reason } = req.body;
        // Note: Kquantity typo fixed to quantity.

        // Validating type
        if (type !== 'IN' && type !== 'OUT') {
            return next(new AppError('Type must be IN or OUT', 400));
        }

        if (!req.body.quantity || req.body.quantity <= 0) {
            return next(new AppError('Quantity must be greater than 0', 400));
        }

        const result = await stockService.updateStock(
            productId,
            type,
            req.body.quantity,
            reason
        );
        res.status(200).json({ status: 'success', data: { product: result } });
    } catch (error) {
        next(error);
    }
};
