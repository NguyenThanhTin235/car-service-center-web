import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export class PublicController {
  /**
   * GET /api/public/categories
   * Lấy danh sách danh mục dịch vụ active
   */
  async getServiceCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.serviceCategory.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          sort_order: true,
          _count: {
            select: { templates: { where: { is_active: true } } },
          },
        },
      });

      res.json({ status: 'success', data: categories });
    } catch {
      res.status(500).json({ status: 'error', message: 'Không thể tải danh mục dịch vụ.' });
    }
  }

  /**
   * GET /api/public/services?categoryId=N
   * Lấy danh sách dịch vụ active (có thể filter theo category)
   */
  async getServiceTemplates(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

      const services = await prisma.serviceTemplate.findMany({
        where: {
          is_active: true,
          ...(categoryId ? { category_id: categoryId } : {}),
        },
        include: {
          category: { select: { id: true, name: true } },
          size_prices: {
            select: { vehicle_size: true, price: true },
            orderBy: { vehicle_size: 'asc' },
          },
        },
        orderBy: [
          { category: { sort_order: 'asc' } },
          { name: 'asc' },
        ],
      });

      // Format response
      const formatted = services.map((svc) => ({
        id: svc.id,
        name: svc.name,
        description: svc.description,
        category: svc.category,
        pricingType: svc.pricing_type,
        fixedPrice: svc.fixed_price,
        sizePrices: svc.size_prices.map((sp) => ({
          vehicleSize: sp.vehicle_size,
          price: sp.price,
        })),
      }));

      res.json({ status: 'success', data: formatted });
    } catch {
      res.status(500).json({ status: 'error', message: 'Không thể tải danh sách dịch vụ.' });
    }
  }
}

export const publicController = new PublicController();
