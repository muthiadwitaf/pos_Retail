import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendResponse } from '../../common/utils/apiResponse';

const paymentService = new PaymentService();

export class PaymentController {
    async process(req: Request, res: Response, next: NextFunction) {
        try {
            const { transactionId, paymentMethod, paidAmount } = req.body;
            const result = await paymentService.processPayment(transactionId, paymentMethod, { paidAmount });
            return sendResponse(res, 200, result, 'Payment processed');
        } catch (error) {
            next(error);
        }
    }

    async webhook(req: Request, res: Response, next: NextFunction) {
        try {
            const { transactionId } = req.body;
            await paymentService.handleQrisWebhook(transactionId);
            return sendResponse(res, 200, null, 'Webhook processed');
        } catch (error) {
            next(error);
        }
    }

    async status(req: Request, res: Response, next: NextFunction) {
        try {
            const transactionId = req.params.transactionId as string;
            const result = await paymentService.checkStatus(transactionId);
            return sendResponse(res, 200, result);
        } catch (error) {
            next(error);
        }
    }
}
