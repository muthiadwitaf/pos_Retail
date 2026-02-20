import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Process payment (Cash or QRIS init)
router.post('/process', protect, paymentController.process.bind(paymentController));

// QRIS payment status check
router.get('/status/:transactionId', protect, paymentController.status.bind(paymentController));

// QRIS Webhook (Mock) - No auth for webhooks usually
router.post('/qris/webhook', paymentController.webhook.bind(paymentController));

export default router;
