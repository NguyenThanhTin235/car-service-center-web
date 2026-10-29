import { WorkOrderStatus } from '@prisma/client';

/**
 * Danh mục nhãn hiển thị tiếng Việt và tiếng Anh cho Work Order Status
 */
export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, { vi: string; en: string }> = {
  [WorkOrderStatus.DRAFT]: { vi: 'Tiếp nhận', en: 'Draft / Intake' },
  [WorkOrderStatus.IN_PLANNING]: { vi: 'Lập kế hoạch', en: 'In Planning' },
  [WorkOrderStatus.PENDING_APPROVAL]: { vi: 'Chờ duyệt', en: 'Pending Approval' },
  [WorkOrderStatus.APPROVED]: { vi: 'Đã duyệt', en: 'Approved' },
  [WorkOrderStatus.IN_PROGRESS]: { vi: 'Đang sửa', en: 'In Progress' },
  [WorkOrderStatus.BILLING_REQUESTED]: { vi: 'Chờ thanh toán', en: 'Billing Requested' },
  [WorkOrderStatus.FINANCIAL_CLEARED]: { vi: 'Chờ giao xe', en: 'Financial Cleared' },
  [WorkOrderStatus.RELEASED]: { vi: 'Đã giao xe', en: 'Released' },
  [WorkOrderStatus.CLOSED]: { vi: 'Đã đóng hồ sơ', en: 'Closed' },
  [WorkOrderStatus.CANCELLED]: { vi: 'Đã hủy', en: 'Cancelled' },
};

/**
 * Ma trận chuyển đổi trạng thái hợp lệ (Allowed Work Order Transitions)
 * Ánh xạ từ trạng thái nguồn sang tập hợp các trạng thái đích được phép
 */
export const ALLOWED_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  [WorkOrderStatus.DRAFT]: [
    WorkOrderStatus.IN_PLANNING,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.IN_PLANNING]: [
    WorkOrderStatus.PENDING_APPROVAL,
    WorkOrderStatus.RELEASED, // Xuất trả xe sớm khi khách không muốn sửa sau chẩn đoán
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.PENDING_APPROVAL]: [
    WorkOrderStatus.APPROVED, // Khách đồng ý báo giá
    WorkOrderStatus.IN_PLANNING, // Khách từ chối: yêu cầu sửa đổi (REVISE)
    WorkOrderStatus.RELEASED, // Khách từ chối: hủy dịch vụ & xuất trả xe (CANCEL)
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.APPROVED]: [
    WorkOrderStatus.IN_PROGRESS, // Bắt đầu thi công / xuất kho phụ tùng
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.IN_PROGRESS, // QC Rework loop
    WorkOrderStatus.BILLING_REQUESTED, // Tất cả Job hoàn thành & QC Pass
  ],
  [WorkOrderStatus.BILLING_REQUESTED]: [
    WorkOrderStatus.FINANCIAL_CLEARED, // Thu ngân ghi nhận thanh toán PAID
  ],
  [WorkOrderStatus.FINANCIAL_CLEARED]: [
    WorkOrderStatus.RELEASED, // Bàn giao xe cho khách hàng
  ],
  [WorkOrderStatus.RELEASED]: [
    WorkOrderStatus.CLOSED, // Đóng hồ sơ vĩnh viễn (Closure Gate)
  ],
  [WorkOrderStatus.CLOSED]: [], // Trạng thái kết thúc (Terminal state)
  [WorkOrderStatus.CANCELLED]: [], // Trạng thái kết thúc (Terminal state)
};

/**
 * Kiểm tra xem một bước chuyển trạng thái có hợp lệ về mặt cấu trúc quy trình hay không
 */
export const isValidWorkOrderTransition = (
  from: WorkOrderStatus,
  to: WorkOrderStatus
): boolean => {
  const allowed = ALLOWED_WORK_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};

/**
 * Các trạng thái mà tại đó Work Order đã kết thúc và không được phép sửa đổi nghiệp vụ
 */
export const TERMINAL_WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = [
  WorkOrderStatus.CLOSED,
  WorkOrderStatus.CANCELLED,
];

/**
 * Kiểm tra xem Work Order đã kết thúc hay chưa
 */
export const isTerminalWorkOrderStatus = (status: WorkOrderStatus): boolean => {
  return TERMINAL_WORK_ORDER_STATUSES.includes(status);
};
