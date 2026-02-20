import { Router } from 'express';
import { getStockMovements, updateStock } from '../controllers/stock.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN')); // Only admin can manage stock manually

router.get('/', getStockMovements);
router.post('/update', updateStock);

export default router;
