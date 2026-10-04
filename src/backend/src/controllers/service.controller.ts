import { Request, Response } from 'express';
import { ServiceService } from '../services/service.service';

const svc = new ServiceService();

// UC-59: Lấy danh sách + UC-59 categories dropdown
export const getServices = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, page, limit } = req.query;
    const result = await svc.getServices(
      search as string,
      categoryId ? parseInt(categoryId as string) : undefined,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const data = await svc.getCategories();
    res.json({ status: 'success', data });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// UC-58: Tạo danh mục dịch vụ
export const createService = async (req: Request, res: Response) => {
  try {
    const data = await svc.createService(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo danh mục dịch vụ thành công', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UC-60: Cập nhật danh mục dịch vụ
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await svc.updateService(parseInt(id as string), req.body);
    res.json({ status: 'success', message: 'Cập nhật danh mục dịch vụ thành công', data });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-61: Toggle active/inactive
export const toggleService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await svc.toggleService(parseInt(id as string));
    res.json({ status: 'success', message: result.isActive ? 'Kích hoạt thành công' : 'Vô hiệu hóa thành công', data: result });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
