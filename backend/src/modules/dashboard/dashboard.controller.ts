import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendResponse } from '../../common/utils/apiResponse';

const dashboardService = new DashboardService();

export class DashboardController {
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await dashboardService.getStats();
            return sendResponse(res, 200, stats);
        } catch (error) {
            next(error);
        }
    }

    async getChartData(req: Request, res: Response, next: NextFunction) {
        try {
            const chartData = await dashboardService.getChartData();
            return sendResponse(res, 200, chartData);
        } catch (error) {
            next(error);
        }
    }
}
