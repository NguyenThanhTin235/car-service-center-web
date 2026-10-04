import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

// UC-51: Lấy danh sách tài khoản
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, page, limit } = req.query;
    const result = await userService.getUsers(
      search as string,
      role as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Lỗi server' });
  }
};

// UC-51: Lấy chi tiết 1 tài khoản
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(Number(id));
    res.json({ status: 'success', data: user });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-50: Tạo tài khoản mới
export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo tài khoản thành công', data: newUser });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message || 'Lỗi khi tạo tài khoản' });
  }
};

// UC-52: Cập nhật tài khoản
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await userService.updateUser(Number(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật tài khoản thành công', data: updatedUser });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-53: Vô hiệu hóa tài khoản
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deactivateUser(Number(id));
    res.status(204).send();
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// Khôi phục tài khoản
export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.reactivateUser(Number(id));
    res.json({ status: 'success', message: 'Khôi phục tài khoản thành công' });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// Đặt lại mật khẩu
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    await userService.resetPassword(Number(id), newPassword);
    res.json({ status: 'success', message: 'Đặt lại mật khẩu thành công' });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
