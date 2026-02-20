import { Router } from 'express';
import { StockController } from './stock.controller';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();
const stockController = new StockController();

router.use(protect);

router.get('/history', stockController.getHistory);

export default router;
