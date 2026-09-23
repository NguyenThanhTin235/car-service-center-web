import { Request, Response } from 'express';
import { SystemCatalogService } from '../services/system-catalog.service';

const svc = new SystemCatalogService();

// UC-71: Lấy danh sách danh mục chung
export const getCatalogs = async (req: Request, res: Response) => {
  try {
    const { search, catalogType, page, limit } = req.query;
    const result = await svc.getCatalogs(
      search as string,
      catalogType as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// UC-70: Tạo danh mục chung
export const createCatalog = async (req: Request, res: Response) => {
  try {
    const data = await svc.createCatalog(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo danh mục chung thành công', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UC-72: Cập nhật danh mục chung
export const updateCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await svc.updateCatalog(parseInt(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật danh mục chung thành công', data });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-73: Toggle active/inactive danh mục chung
export const toggleCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await svc.toggleCatalog(parseInt(id));
    res.json({ status: 'success', message: result.isActive ? 'Kích hoạt thành công' : 'Vô hiệu hóa thành công', data: result });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
