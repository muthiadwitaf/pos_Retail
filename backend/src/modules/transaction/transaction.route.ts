import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { protect } from '../../common/middleware/auth.middleware';

const router = Router();
const transactionController = new TransactionController();

router.use(protect);

router.post('/checkout', transactionController.checkout);
router.get('/history', transactionController.getHistory);

export default router;
