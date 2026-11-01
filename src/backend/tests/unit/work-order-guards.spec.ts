import { describe, it, expect } from 'vitest';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'IN_PLANNING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'QC_PENDING'
  | 'READY_FOR_RELEASE'
  | 'RELEASED'
  | 'CLOSED'
  | 'CANCELLED';

/**
 * Kiểm tra hợp lệ của chuyển đổi trạng thái Work Order (SPEC-WO-STATE)
 */
export function canTransitionWorkOrderStatus(
  current: WorkOrderStatus,
  target: WorkOrderStatus
): { allowed: boolean; reason?: string } {
  // Trạng thái đóng vĩnh viễn không thể chuyển sang trạng thái khác
  const terminalStatuses: WorkOrderStatus[] = ['RELEASED', 'CLOSED', 'CANCELLED'];
  if (terminalStatuses.includes(current)) {
    return {
      allowed: false,
      reason: `Phiếu công việc đã ở trạng thái kết thúc (${current}), không thể thay đổi.`,
    };
  }

  const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    DRAFT: ['IN_PLANNING', 'CANCELLED'],
    IN_PLANNING: ['PENDING_APPROVAL', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'IN_PLANNING', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['QC_PENDING', 'CANCELLED'],
    QC_PENDING: ['READY_FOR_RELEASE', 'IN_PROGRESS'], // IN_PROGRESS nếu QC thất bại cần Rework
    READY_FOR_RELEASE: ['RELEASED'],
    RELEASED: [],
    CLOSED: [],
    CANCELLED: [],
  };

  const allowedTargets = validTransitions[current] || [];
  if (allowedTargets.includes(target)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Chuyển đổi bất hợp lệ từ ${current} sang ${target}.`,
  };
}

/**
 * Điều kiện kiểm tra trước khi Bàn giao xe (Release Vehicle Guard - UC-42)
 */
export function validateVehicleRelease(params: {
  workOrderStatus: WorkOrderStatus;
  allJobsCompleted: boolean;
  qcPassed: boolean;
  invoicePaid: boolean;
}): { canRelease: boolean; errors: string[] } {
  const errors: string[] = [];

  if (['RELEASED', 'CLOSED'].includes(params.workOrderStatus)) {
    errors.push(`Phiếu công việc đã được bàn giao hoặc đóng (${params.workOrderStatus}).`);
    return { canRelease: false, errors };
  }

  if (!params.allJobsCompleted) {
    errors.push('Còn công việc (Job) chưa hoàn thành.');
  }

  if (!params.qcPassed) {
    errors.push('Chưa hoàn thành kiểm định chất lượng (QC) hoặc kết quả kiểm định không đạt.');
  }

  if (!params.invoicePaid) {
    errors.push('Hóa đơn dịch vụ chưa được thanh toán.');
  }

  return {
    canRelease: errors.length === 0,
    errors,
  };
}

describe('Work Order State Machine & Release Guard (SPEC-WO-TRANSITION / UC-29, UC-42)', () => {
  describe('State Machine Transitions (canTransitionWorkOrderStatus)', () => {
    it('WO-ST-01: Cho phép luồng chuyển trạng thái chuẩn (Happy Path)', () => {
      expect(canTransitionWorkOrderStatus('DRAFT', 'IN_PLANNING').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('IN_PLANNING', 'PENDING_APPROVAL').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('PENDING_APPROVAL', 'APPROVED').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('APPROVED', 'IN_PROGRESS').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('IN_PROGRESS', 'QC_PENDING').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('QC_PENDING', 'READY_FOR_RELEASE').allowed).toBe(true);
      expect(canTransitionWorkOrderStatus('READY_FOR_RELEASE', 'RELEASED').allowed).toBe(true);
    });

    it('WO-ST-02: Chặn các bước nhảy cóc trạng thái bất hợp lệ', () => {
      // Không được nhảy từ DRAFT thẳng lên IN_PROGRESS khi chưa duyệt báo giá
      const res1 = canTransitionWorkOrderStatus('DRAFT', 'IN_PROGRESS');
      expect(res1.allowed).toBe(false);

      // Không được nhảy từ PENDING_APPROVAL thẳng lên RELEASED
      const res2 = canTransitionWorkOrderStatus('PENDING_APPROVAL', 'RELEASED');
      expect(res2.allowed).toBe(false);
    });

    it('WO-ST-03: Cho phép quay lui về IN_PLANNING khi khách từ chối báo giá', () => {
      const res = canTransitionWorkOrderStatus('PENDING_APPROVAL', 'IN_PLANNING');
      expect(res.allowed).toBe(true);
    });

    it('WO-ST-04: Cho phép quay lui về IN_PROGRESS khi QC phát hiện lỗi cần Rework', () => {
      const res = canTransitionWorkOrderStatus('QC_PENDING', 'IN_PROGRESS');
      expect(res.allowed).toBe(true);
    });

    it('WO-ST-05: Khóa vĩnh viễn khi phiếu đã RELEASED hoặc CLOSED', () => {
      expect(canTransitionWorkOrderStatus('RELEASED', 'IN_PROGRESS').allowed).toBe(false);
      expect(canTransitionWorkOrderStatus('CLOSED', 'DRAFT').allowed).toBe(false);
    });
  });

  describe('Vehicle Release Guard (validateVehicleRelease - UC-42)', () => {
    it('REL-01: Cho phép bàn giao xe khi thỏa mãn cả 3 điều kiện (Job xong, QC Đạt, Đã thanh toán)', () => {
      const result = validateVehicleRelease({
        workOrderStatus: 'READY_FOR_RELEASE',
        allJobsCompleted: true,
        qcPassed: true,
        invoicePaid: true,
      });

      expect(result.canRelease).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('REL-02: Chặn bàn giao khi hóa đơn chưa thanh toán', () => {
      const result = validateVehicleRelease({
        workOrderStatus: 'QC_PENDING',
        allJobsCompleted: true,
        qcPassed: true,
        invoicePaid: false, // Chưa thanh toán
      });

      expect(result.canRelease).toBe(false);
      expect(result.errors).toContain('Hóa đơn dịch vụ chưa được thanh toán.');
    });

    it('REL-03: Chặn bàn giao khi kiểm định QC chưa đạt', () => {
      const result = validateVehicleRelease({
        workOrderStatus: 'IN_PROGRESS',
        allJobsCompleted: true,
        qcPassed: false, // QC chưa đạt
        invoicePaid: true,
      });

      expect(result.canRelease).toBe(false);
      expect(result.errors).toContain('Chưa hoàn thành kiểm định chất lượng (QC) hoặc kết quả kiểm định không đạt.');
    });

    it('REL-04: Chặn bàn giao trùng lặp nếu xe đã được RELEASED trước đó', () => {
      const result = validateVehicleRelease({
        workOrderStatus: 'RELEASED',
        allJobsCompleted: true,
        qcPassed: true,
        invoicePaid: true,
      });

      expect(result.canRelease).toBe(false);
      expect(result.errors[0]).toContain('Phiếu công việc đã được bàn giao');
    });
  });
});

