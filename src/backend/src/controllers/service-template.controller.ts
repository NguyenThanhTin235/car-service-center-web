import { Request, Response } from 'express';
import { ServiceTemplateService } from '../services/service-template.service';

const svc = new ServiceTemplateService();

// UC-59: Lấy danh sách + UC-59 categories dropdown
export const getServiceTemplates = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, page, limit } = req.query;
    const result = await svc.getServiceTemplates(
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
export const createServiceTemplate = async (req: Request, res: Response) => {
  try {
    const data = await svc.createServiceTemplate(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo danh mục dịch vụ thành công', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UC-60: Cập nhật danh mục dịch vụ
export const updateServiceTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await svc.updateServiceTemplate(parseInt(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật danh mục dịch vụ thành công', data });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-61: Toggle active/inactive
export const toggleServiceTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await svc.toggleServiceTemplate(parseInt(id));
    res.json({ status: 'success', message: result.isActive ? 'Kích hoạt thành công' : 'Vô hiệu hóa thành công', data: result });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
