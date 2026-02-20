import { Router } from 'express';
import { checkout, getTransactions, getTransactionById } from '../controllers/transaction.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);

export default router;
