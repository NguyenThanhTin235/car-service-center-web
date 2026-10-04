import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';

const employeeService = new EmployeeService();

// UC-55: Lấy danh sách nhân viên
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { search, position, page, limit } = req.query;
    const result = await employeeService.getEmployees(
      search as string,
      position as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ status: 'success', ...result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Lỗi server' });
  }
};

// UC-55: Lấy chi tiết 1 nhân viên
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(Number(id));
    res.json({ status: 'success', data: employee });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-54: Tạo nhân viên mới
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const newEmployee = await employeeService.createEmployee(req.body);
    res.status(201).json({ status: 'success', message: 'Tạo nhân viên thành công', data: newEmployee });
  } catch (error: any) {
    res.status(400).json({ status: 'error', message: error.message || 'Lỗi khi tạo nhân viên' });
  }
};

// UC-56: Cập nhật thông tin nhân viên
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedEmployee = await employeeService.updateEmployee(Number(id), req.body);
    res.json({ status: 'success', message: 'Cập nhật nhân viên thành công', data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// UC-57: Vô hiệu hóa nhân viên
export const deactivateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await employeeService.deactivateEmployee(Number(id));
    res.status(204).send();
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// Khôi phục nhân viên
export const reactivateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await employeeService.reactivateEmployee(Number(id));
    res.status(200).json({ status: 'success', message: 'Khôi phục nhân viên thành công' });
  } catch (error: any) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

// Lấy danh sách kỹ năng
export const getSkills = async (_req: Request, res: Response) => {
  try {
    const skills = await employeeService.getSkills();
    res.json({ status: 'success', data: skills });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
