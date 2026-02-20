import { Request, Response, NextFunction } from 'express';
import { StockRepository } from './stock.repository';
import { sendResponse } from '../../common/utils/apiResponse';

const stockRepository = new StockRepository();

export class StockController {
    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.query;
            const history = await stockRepository.getHistory(productId as string);
            return sendResponse(res, 200, { history });
        } catch (error) {
            next(error);
        }
    }
}
