import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';

const vehicleService = new VehicleService();

// UC-08: Lấy danh sách xe của chính mình
export const getMyVehicles = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const vehicles = await vehicleService.getMyVehicles(customerId);
    res.json({ status: 'success', data: vehicles });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Lỗi khi tải danh sách xe.' });
  }
};

// UC-07: Thêm xe mới
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const vehicle = await vehicleService.createVehicle(customerId, req.body);
    res.status(201).json({ status: 'success', message: 'Thêm xe thành công.', data: vehicle });
  } catch (error: any) {
    const statusCode = error.message.includes('đã tồn tại') ? 409 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message || 'Lỗi khi thêm xe.' });
  }
};

// UC-09: Cập nhật thông tin xe
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;
    const updated = await vehicleService.updateVehicle(Number(id), customerId, req.body);
    res.json({ status: 'success', message: 'Cập nhật xe thành công.', data: updated });
  } catch (error: any) {
    const statusCode = error.message.includes('không có quyền') ? 403
      : error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-10: Xóa hoặc vô hiệu hóa xe
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;
    const result = await vehicleService.deleteVehicle(Number(id), customerId);
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    const statusCode = error.message.includes('không có quyền') ? 403
      : error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
