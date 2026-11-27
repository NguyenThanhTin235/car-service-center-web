import { Request, Response } from 'express';
import { serviceService } from '../services/service.service';
import logger from '../loggers/logger';

const ALLOWED_VITALS = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']);

export class PublicController {
  /**
   * GET /api/public/categories
   * Lấy danh sách danh mục dịch vụ active
   */
  async getServiceCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await serviceService.getPublicCategories();
      res.json({ status: 'success', data: categories });
    } catch (err) {
      console.error('[PublicController] getServiceCategories error:', err);
      res.status(500).json({ status: 'error', message: 'Không thể tải danh mục dịch vụ.' });
    }
  }

  /**
   * GET /api/public/services?categoryId=N
   * Lấy danh sách dịch vụ active (có thể filter theo category)
   */
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const parsedCategoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const formatted = await serviceService.getPublicServices(parsedCategoryId);
      res.json({ status: 'success', data: formatted });
    } catch (err) {
      console.error('[PublicController] getServices error:', err);
      res.status(500).json({ status: 'error', message: 'Không thể tải danh sách dịch vụ.' });
    }
  }

  /**
   * POST /api/public/web-vitals
   * Thu thập Field Data RUM (Core Web Vitals) từ trình duyệt người dùng thật
   */
  async recordWebVitals(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      name?: string;
      value?: number;
      rating?: string;
      path?: string;
      app?: string;
    };
    const metricName = typeof body?.name === 'string' ? body.name.toUpperCase() : '';
    const metricValue = typeof body?.value === 'number' ? body.value : Number.NaN;

    if (!ALLOWED_VITALS.has(metricName) || Number.isNaN(metricValue)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu Web Vitals không hợp lệ.',
        error: { code: 'INVALID_WEB_VITAL_PAYLOAD' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info('[RUM WebVitals]', {
      app: typeof body.app === 'string' ? body.app.slice(0, 32) : 'unknown',
      path: typeof body.path === 'string' ? body.path.slice(0, 120) : '/',
      metric: metricName,
      value: Number(metricValue.toFixed(2)),
      rating: typeof body.rating === 'string' ? body.rating.slice(0, 24) : 'unknown',
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Đã ghi nhận chỉ số Web Vitals',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}

export const publicController = new PublicController();
