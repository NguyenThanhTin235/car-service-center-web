import Joi from 'joi';

/**
 * Filter DTO cho Báo cáo Thống kê & Phân tích Quản trị Bảo hành (UC-87)
 */
export interface WarrantyReportFilterDto {
  startDate?: string;
  endDate?: string;
  groupBy?: 'TECHNICIAN' | 'CATEGORY' | 'PART';
}

/**
 * Joi Schema validate query params cho báo cáo bảo hành
 */
export const warrantyReportQuerySchema = Joi.object({
  startDate: Joi.string()
    .isoDate()
    .optional()
    .messages({
      'string.isoDate': 'Ngày bắt đầu phải đúng định dạng ngày tháng hợp lệ (YYYY-MM-DD)',
    }),
  endDate: Joi.string()
    .isoDate()
    .optional()
    .messages({
      'string.isoDate': 'Ngày kết thúc phải đúng định dạng ngày tháng hợp lệ (YYYY-MM-DD)',
    }),
  groupBy: Joi.string()
    .valid('TECHNICIAN', 'CATEGORY', 'PART')
    .optional()
    .messages({
      'any.only': 'Tiêu chí phân tích phải là TECHNICIAN, CATEGORY hoặc PART',
    }),
});

/**
 * Cấu trúc thông tin nhà cung cấp bồi hoàn
 */
export interface WarrantySupplierInfo {
  supplierId: number | null;
  supplierName: string;
  supplierPhone: string | null;
  supplierEmail: string | null;
  supplierContact: string | null;
}

/**
 * Cấu trúc danh mục phụ tùng lỗi nhiều nhất
 */
export interface TopFaultyPartItem {
  itemId: number;
  sku: string;
  partName: string;
  categoryName: string;
  faultyCount: number;
  totalWarrantyMwaCost: number;
  defectRate: number; // Phần trăm (%)
  supplier: WarrantySupplierInfo;
}

/**
 * Cấu trúc phân tích lỗi theo Kỹ thuật viên
 */
export interface TechnicianWarrantyAnalysis {
  technicianId: number;
  technicianName: string;
  position?: string;
  warrantyCasesCount: number;
  workOrders: Array<{
    warrantyWoId: number;
    warrantyWoNumber: string;
    parentWoId?: number | null;
    parentWoNumber?: string | null;
    licensePlate?: string;
    createdAt: string;
  }>;
}

/**
 * Cấu trúc phân tích lỗi theo Nhóm dịch vụ
 */
export interface CategoryWarrantyAnalysis {
  categoryId: number;
  categoryName: string;
  warrantyCasesCount: number;
  totalWarrantyMwaCost: number;
}

/**
 * Cấu trúc tổng thể kết quả Báo cáo Bảo hành (UC-87)
 */
export interface WarrantyReportResult {
  period: {
    start: string;
    end: string;
  };
  operationalMetrics: {
    totalServedCount: number;      // Tổng số lượt xe phục vụ toàn xưởng
    warrantyCasesCount: number;    // Tổng số lượt xe tiếp nhận bảo hành
    warrantyRate: number;          // Tỷ lệ xe bảo hành (%)
  };
  costMetrics: {
    totalWarrantyMwaCost: number;  // Tổng chi phí vốn thiệt hại (MWA)
    totalPartsQuantity: number;    // Tổng số linh kiện phụ tùng bảo hành đã xuất kho
  };
  topFaultyParts: TopFaultyPartItem[];
  technicalAnalysis: {
    byTechnician: TechnicianWarrantyAnalysis[];
    byCategory: CategoryWarrantyAnalysis[];
  };
}

