import { Request, Response } from 'express';
import { JobTypeService } from '../services/job-type.service';

const svc = new JobTypeService();

// UC-63: Lấy danh sách loại công việc
export const getJobTypes = async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    const result = await svc.getJobTypes(
      search as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// UC-62: Tạo loại công việc
export const createJobType = async (req: Request, res: Response) => {
  try {
    const data = await svc.createJobType(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo loại công việc thành công', data });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UC-64: Cập nhật loại công việc
export const updateJobType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await svc.updateJobType(parseInt(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật loại công việc thành công', data });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-65: Toggle active/inactive
export const toggleJobType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await svc.toggleJobType(parseInt(id));
    res.json({ status: 'success', message: result.isActive ? 'Kích hoạt thành công' : 'Vô hiệu hóa thành công', data: result });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
