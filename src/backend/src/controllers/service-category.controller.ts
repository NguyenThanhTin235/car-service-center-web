import { Request, Response } from 'express';
import { ServiceCategoryService } from '../services/service-category.service';

const svc = new ServiceCategoryService();

// UC-63: Lấy danh sách danh mục dịch vụ
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    const result = await svc.getCategories(
      search as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// UC-62: Tạo danh mục dịch vụ
export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = await svc.createCategory(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo nhóm dịch vụ thành công', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UC-64: Cập nhật danh mục dịch vụ
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await svc.updateCategory(parseInt(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật nhóm dịch vụ thành công', data });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-65: Xóa/Vô hiệu hóa danh mục dịch vụ
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await svc.deleteCategory(parseInt(id));
    res.json({ status: 'success', message: result.message, data: result });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
