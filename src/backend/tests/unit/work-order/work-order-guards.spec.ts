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


/**
 * Kiểm tra quyền xóa Job trong phiếu công việc (SPEC-JOB-DELETE)
 */
export function canDeleteJobGuard(params: {
  jobStatus: string;
  workOrderStatus: string;
  hasApprovedQuotation?: boolean;
  isJobInApprovedQuotation?: boolean;
}): { allowed: boolean; reason?: string } {
  const approvedWoStatuses = [
    'APPROVED',
    'IN_PROGRESS',
    'BILLING_REQUESTED',
    'FINANCIAL_CLEARED',
    'RELEASED',
    'CLOSED',
  ];

  if (
    approvedWoStatuses.includes(params.workOrderStatus) ||
    params.hasApprovedQuotation ||
    params.isJobInApprovedQuotation
  ) {
    return {
      allowed: false,
      reason: 'Không thể xóa công việc khi báo giá đã được khách hàng phê duyệt. Mọi điều chỉnh công việc sau khi duyệt cần thông qua quy trình Báo giá bổ sung.',
    };
  }

  if (params.jobStatus !== 'PLANNED') {
    return {
      allowed: false,
      reason: 'Không thể xóa công việc đang ở trạng thái ' + params.jobStatus + '.',
    };
  }

  return { allowed: true };
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

  describe('Job Deletion Guard (canDeleteJobGuard - UC-34 / UC-24)', () => {
    it('JOB-DEL-01: Cho phép xóa Job ở trạng thái PLANNED khi Work Order đang ở IN_PLANNING', () => {
      const result = canDeleteJobGuard({
        jobStatus: 'PLANNED',
        workOrderStatus: 'IN_PLANNING',
        hasApprovedQuotation: false,
      });
      expect(result.allowed).toBe(true);
    });

    it('JOB-DEL-02: Chặn xóa Job khi khách hàng đã duyệt báo giá (WO status là APPROVED hoặc IN_PROGRESS)', () => {
      const resApproved = canDeleteJobGuard({
        jobStatus: 'PLANNED',
        workOrderStatus: 'APPROVED',
        hasApprovedQuotation: true,
      });
      expect(resApproved.allowed).toBe(false);
      expect(resApproved.reason).toContain('đã được khách hàng phê duyệt');

      const resInProgress = canDeleteJobGuard({
        jobStatus: 'PLANNED',
        workOrderStatus: 'IN_PROGRESS',
        hasApprovedQuotation: true,
      });
      expect(resInProgress.allowed).toBe(false);
      expect(resInProgress.reason).toContain('đã được khách hàng phê duyệt');
    });

    it('JOB-DEL-03: Chặn xóa Job nếu Job đã được đưa vào một báo giá đã APPROVED', () => {
      const result = canDeleteJobGuard({
        jobStatus: 'PLANNED',
        workOrderStatus: 'IN_PLANNING',
        isJobInApprovedQuotation: true,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('đã được khách hàng phê duyệt');
    });

    it('JOB-DEL-04: Chặn xóa Job khi Job đã chuyển sang IN_PROGRESS hoặc COMPLETED', () => {
      const result = canDeleteJobGuard({
        jobStatus: 'IN_PROGRESS',
        workOrderStatus: 'IN_PLANNING',
        hasApprovedQuotation: false,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Không thể xóa công việc đang ở trạng thái IN_PROGRESS');
    });
  });

});



/**
 * Closure Gate validator cho việc đóng hồ sơ Work Order
 */
export function validateWorkOrderClosure(params: {
  workOrderStatus: string;
  hasReleaseRecord: boolean;
  activeJobsCount: number;
  reservedPartsCount: number;
  unpaidInvoicesCount: number;
}): { canClose: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.workOrderStatus !== 'RELEASED') {
    errors.push(`Chỉ có thể đóng hồ sơ khi xe đã bàn giao (RELEASED). Trạng thái hiện tại: ${params.workOrderStatus}.`);
  }

  if (!params.hasReleaseRecord) {
    errors.push('Phiếu công việc chưa có biên bản bàn giao xe.');
  }

  if (params.activeJobsCount > 0) {
    errors.push(`Còn ${params.activeJobsCount} công việc đang thực hiện.`);
  }

  if (params.reservedPartsCount > 0) {
    errors.push(`Còn ${params.reservedPartsCount} phụ tùng đang giữ chỗ.`);
  }

  if (params.unpaidInvoicesCount > 0) {
    errors.push('Hóa đơn chưa được thanh toán đầy đủ.');
  }

  return {
    canClose: errors.length === 0,
    errors,
  };
}

describe('Work Order Closure Gate (SPEC-WO-CLOSURE)', () => {
  it('CLOSE-01: Cho phép đóng hồ sơ khi đã RELEASED, có biên bản bàn giao và hóa đơn đã thanh toán đầy đủ', () => {
    const res = validateWorkOrderClosure({
      workOrderStatus: 'RELEASED',
      hasReleaseRecord: true,
      activeJobsCount: 0,
      reservedPartsCount: 0,
      unpaidInvoicesCount: 0,
    });
    expect(res.canClose).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('CLOSE-02: Chặn đóng hồ sơ khi WO chưa ở trạng thái RELEASED', () => {
    const res = validateWorkOrderClosure({
      workOrderStatus: 'IN_PROGRESS',
      hasReleaseRecord: true,
      activeJobsCount: 0,
      reservedPartsCount: 0,
      unpaidInvoicesCount: 0,
    });
    expect(res.canClose).toBe(false);
    expect(res.errors[0]).toContain('Chỉ có thể đóng hồ sơ khi xe đã bàn giao (RELEASED)');
  });

  it('CLOSE-03: Chặn đóng hồ sơ khi chưa có biên bản bàn giao', () => {
    const res = validateWorkOrderClosure({
      workOrderStatus: 'RELEASED',
      hasReleaseRecord: false,
      activeJobsCount: 0,
      reservedPartsCount: 0,
      unpaidInvoicesCount: 0,
    });
    expect(res.canClose).toBe(false);
    expect(res.errors).toContain('Phiếu công việc chưa có biên bản bàn giao xe.');
  });

  it('CLOSE-04: Chặn đóng hồ sơ khi hóa đơn chưa thanh toán hoặc còn phụ tùng giữ chỗ', () => {
    const res = validateWorkOrderClosure({
      workOrderStatus: 'RELEASED',
      hasReleaseRecord: true,
      activeJobsCount: 0,
      reservedPartsCount: 2,
      unpaidInvoicesCount: 1,
    });
    expect(res.canClose).toBe(false);
    expect(res.errors).toContain('Còn 2 phụ tùng đang giữ chỗ.');
    expect(res.errors).toContain('Hóa đơn chưa được thanh toán đầy đủ.');
  });
});
