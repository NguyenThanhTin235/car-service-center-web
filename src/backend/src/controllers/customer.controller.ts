import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';

const customerService = new CustomerService();

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search, page, limit, status } = req.query;
    const pageNumber = page ? parseInt(page as string) : 1;
    const limitNumber = limit ? parseInt(limit as string) : 10;
    const statusParam = (status as 'active' | 'deleted' | 'all') || 'active';

    const result = await customerService.getCustomers(search as string, pageNumber, limitNumber, statusParam);
    res.json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi tải danh sách khách hàng',
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const newCustomer = await customerService.createCustomer(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Tạo hồ sơ khách hàng thành công',
      data: newCustomer,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi tạo khách hàng',
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedCustomer = await customerService.updateCustomer(Number(id), req.body);
    res.json({
      status: 'success',
      message: 'Cập nhật hồ sơ thành công',
      data: updatedCustomer,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi cập nhật khách hàng',
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await customerService.softDeleteCustomer(Number(id));
    res.json({
      status: 'success',
      message: 'Xóa hồ sơ khách hàng thành công',
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi xóa khách hàng',
    });
  }
};

export const restoreCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await customerService.restoreCustomer(Number(id));
    res.json({
      status: 'success',
      message: 'Khôi phục hồ sơ khách hàng thành công',
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi khôi phục khách hàng',
    });
  }
};

export const hardDeleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await customerService.hardDeleteCustomer(Number(id));
    res.json({
      status: 'success',
      message: 'Xóa vĩnh viễn hồ sơ khách hàng thành công',
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lỗi khi xóa vĩnh viễn khách hàng',
    });
  }
};
