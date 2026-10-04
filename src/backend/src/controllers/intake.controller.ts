import { Request, Response } from 'express';
import { IntakeService } from '../services/intake.service';
import { createIntakeSchema } from '../dtos/intake.dto';
import { IntakeStatus } from '@prisma/client';

const intakeService = new IntakeService();

/**
 * GET /api/intake
 * Lấy danh sách hàng đợi tiếp nhận
 */
export const getIntakeQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, search, page, limit } = req.query;

    const result = await intakeService.getIntakeQueue({
      status: status as IntakeStatus | undefined,
      date: date as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách tiếp nhận thành công',
      data: result.data,
      meta: { pagination: result.pagination },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi lấy danh sách tiếp nhận',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/intake/:id
 * Lấy chi tiết phiếu tiếp nhận
 */
export const getIntakeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await intakeService.getIntakeById(Number(id));

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết phiếu tiếp nhận thành công',
      data: record,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      code: 404,
      message: error.message || 'Không tìm thấy phiếu tiếp nhận',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/intake
 * Tạo phiếu tiếp nhận Walk-in / Tow-in
 */
export const createIntake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createIntakeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors: Record<string, string> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errors[key] = detail.message;
      });

      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu không hợp lệ',
        data: null,
        errors,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const createdById = req.user?.id;
    if (!createdById) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Chưa xác thực người dùng',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const intakeRecord = await intakeService.createIntake(value, createdById);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Tiếp nhận xe thành công',
      data: intakeRecord,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.message.includes('không tồn tại') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tiếp nhận xe',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/intake/:id/cancel
 * Hủy phiếu tiếp nhận
 */
export const cancelIntake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await intakeService.cancelIntake(Number(id));

    res.json({
      success: true,
      code: 200,
      message: 'Hủy phiếu tiếp nhận thành công',
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi hủy phiếu tiếp nhận',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};
