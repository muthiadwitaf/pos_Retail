import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { protect } from '../../common/middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.use(protect);
router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getChartData);

export default router;
