import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';
import { sendResponse } from '../../common/utils/apiResponse';

const transactionService = new TransactionService();

export class TransactionController {
    async checkout(req: any, res: Response, next: NextFunction) {
        try {
            const result = await transactionService.checkout(req.user.id, req.body);
            return sendResponse(res, 201, result, 'Transaction completed');
        } catch (error) {
            next(error);
        }
    }

    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 10);
            const skip = (page - 1) * limit;

            const { transactions, total } = await transactionService.getHistory({
                skip,
                take: limit
            });

            return sendResponse(res, 200, {
                transactions,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
