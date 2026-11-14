/**
 * Format tiền tệ VNĐ chuẩn hóa (hỗ trợ hiển thị rút gọn tỷ ₫, tr ₫ hoặc đầy đủ)
 */
export function formatVND(value: number, compact = false): string {
  if (isNaN(value)) return '0 ₫';

  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      const billions = (value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '');
      return `${billions} tỷ ₫`;
    }
    if (Math.abs(value) >= 1_000_000) {
      const millions = (value / 1_000_000).toFixed(1).replace(/\.?0+$/, '');
      return `${millions} tr ₫`;
    }
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format số nguyên có dấu chấm ngăn cách hàng nghìn theo chuẩn Việt Nam
 */
export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format phần trăm có dấu cộng trừ rõ ràng
 */
export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  const rounded = (Math.round((value + Number.EPSILON) * 10) / 10).toFixed(1);
  const sign = value > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

/**
 * Bảng dịch chuẩn hóa phân quyền & vai trò người dùng sang Tiếng Việt
 */
export const ROLE_VIETNAMESE_MAP: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý xưởng',
  'DESK STAFF': 'Nhân viên lễ tân',
  FRONT_DESK: 'Nhân viên lễ tân',
  SA: 'Cố vấn dịch vụ (SA)',
  ADVISOR: 'Cố vấn dịch vụ',
  'SERVICE ADVISOR': 'Cố vấn dịch vụ',
  TECHNICIAN: 'Kỹ thuật viên',
  CUSTOMER: 'Khách hàng',
};

/**
 * Màu sắc nhận diện chuẩn từng vai trò
 */
export const ROLE_COLOR_MAP: Record<string, string> = {
  ADMIN: '#0050cd', // Blue 600
  MANAGER: '#0ea5e9', // Sky 500
  'DESK STAFF': '#10b981', // Emerald 500
  FRONT_DESK: '#10b981',
  SA: '#f59e0b', // Amber 500
  ADVISOR: '#f59e0b',
  'SERVICE ADVISOR': '#f59e0b',
  TECHNICIAN: '#ef4444', // Rose 500
  CUSTOMER: '#8b5cf6', // Purple 500
};

/**
 * Chuẩn hóa tên vai trò tiếng Anh sang tiếng Việt thân thiện
 */
export function formatRoleName(role?: string): string {
  if (!role) return 'Chưa phân quyền';
  const cleanKey = role.trim().toUpperCase();
  return ROLE_VIETNAMESE_MAP[cleanKey] || role;
}
