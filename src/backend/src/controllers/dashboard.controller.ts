import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const getWorkshopDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await dashboardService.getWorkshopDashboard();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
