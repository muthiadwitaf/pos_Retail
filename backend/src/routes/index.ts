import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route';
import productRoutes from '../modules/product/product.route';
import categoryRoutes from '../modules/category/category.route';
import transactionRoutes from '../modules/transaction/transaction.route';
import stockRoutes from '../modules/stock/stock.route';
import dashboardRoutes from '../modules/dashboard/dashboard.route';
import paymentRoutes from '../modules/payment/payment.route';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Clean Arch API is healthy' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/stocks', stockRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);

export default router;
