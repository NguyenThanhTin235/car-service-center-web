import { Request, Response } from 'express';
import { WarrantyService } from '../services/warranty.service';

const warrantyService = new WarrantyService();

/**
 * GET /api/warranty/vehicles/:vehicleId/eligibility
 * UC-81: Tra cứu thông tin hạn bảo hành theo ID xe
 */
export const checkVehicleWarrantyEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleId = Number(req.params.vehicleId);
    if (isNaN(vehicleId) || vehicleId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Mã phương tiện không hợp lệ.',
      });
      return;
    }

    const currentOdo = req.query.odometer !== undefined ? Number(req.query.odometer) : undefined;
    const userContext = req.user
      ? {
          userId: req.user.id,
          roles: Array.isArray((req.user as any).roles)
            ? (req.user as any).roles
            : [(req.user as any).role || 'CUSTOMER'],
        }
      : undefined;

    const result = await warrantyService.checkVehicleWarrantyEligibility(
      { vehicleId },
      currentOdo,
      userContext
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes('Không tìm thấy');
    const isForbidden = error.message?.includes('quyền truy cập');
    const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi khi tra cứu thông tin bảo hành phương tiện.',
    });
  }
};

/**
 * GET /api/warranty/lookup
 * UC-81: Tra cứu bảo hành linh hoạt theo Biển số xe hoặc vehicleId
 */
export const lookupWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { licensePlate, vehicleId, odometer } = req.query;

    if (!licensePlate && !vehicleId) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Biển số xe (licensePlate) hoặc Mã xe (vehicleId) để tra cứu.',
      });
      return;
    }

    const currentOdo = odometer !== undefined ? Number(odometer) : undefined;
    const userContext = req.user
      ? {
          userId: req.user.id,
          roles: Array.isArray((req.user as any).roles)
            ? (req.user as any).roles
            : [(req.user as any).role || 'CUSTOMER'],
        }
      : undefined;

    const result = await warrantyService.checkVehicleWarrantyEligibility(
      {
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        licensePlate: licensePlate ? String(licensePlate) : undefined,
      },
      currentOdo,
      userContext
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes('Không tìm thấy');
    const isForbidden = error.message?.includes('quyền truy cập');
    const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi khi tra cứu thông tin bảo hành.',
    });
  }
};

/**
 * POST /api/warranty/validate-odo
 * UC-83: Kiểm tra chống tua lùi ODO khi tiếp nhận xe bảo hành
 */
export const validateOdoIntake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentWoId, intakeOdo } = req.body;

    if (!parentWoId || isNaN(Number(parentWoId))) {
      res.status(400).json({
        success: false,
        message: 'Mã phiếu dịch vụ gốc (parentWoId) là bắt buộc.',
      });
      return;
    }

    if (intakeOdo === undefined || intakeOdo === null || isNaN(Number(intakeOdo))) {
      res.status(400).json({
        success: false,
        message: 'Số km ODO tiếp nhận (intakeOdo) là bắt buộc.',
      });
      return;
    }

    const result = await warrantyService.validateOdoIntake(Number(parentWoId), Number(intakeOdo));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Kiểm tra ODO tiếp nhận thất bại.',
    });
  }
};

/**
 * GET /api/warranty/vehicles/:vehicleId/history
 * UC-83: Lấy danh sách các phiếu dịch vụ đã hoàn thành của xe để nhân viên quầy chọn phiếu gốc
 */
export const getCompletedWorkOrdersForVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleId = Number(req.params.vehicleId);
    if (isNaN(vehicleId) || vehicleId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Mã phương tiện không hợp lệ.',
      });
      return;
    }

    const result = await warrantyService.getCompletedWorkOrdersForVehicle(vehicleId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử phiếu dịch vụ đã hoàn thành.',
    });
  }
};

