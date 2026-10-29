import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export const getOperationalReport = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'revenue';
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;

    if (!['revenue', 'services', 'inventory'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại báo cáo không hợp lệ (revenue, services hoặc inventory)' });
    }

    const result = await reportService.getOperationalReport(type as any, start, end);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
