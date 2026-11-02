import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qcService } from '../../src/services/qc.service';
import prisma from '../../src/utils/prisma';
import { QcResult, JobStatus, ServiceStatus, WorkOrderStatus } from '@prisma/client';

describe('Unit Test - QC Workflow & Rework Loop (UC-41 / SPEC-QC-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitQcEvaluation()', () => {
    it('QC-01: Đánh giá 100% PASS -> Cập nhật các Job sang PASSED và WoService sang COMPLETED', async () => {
      const mockWorkOrder = {
        id: 101,
        status: WorkOrderStatus.IN_PROGRESS,
        services: [{ id: 1, name: 'Bảo dưỡng phanh', status: ServiceStatus.IN_PROGRESS }],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: { findUnique: vi.fn().mockResolvedValue(mockWorkOrder) },
          qcRecord: {
            create: vi.fn().mockResolvedValue({ id: 501, overall_result: QcResult.PASS }),
          },
          qcItem: {
            create: vi.fn().mockResolvedValue({ id: 1001, result: QcResult.PASS }),
          },
          job: {
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            create: vi.fn(),
          },
          woService: {
            update: vi.fn().mockResolvedValue({ id: 1, status: ServiceStatus.COMPLETED }),
          },
          jobType: { findFirst: vi.fn().mockResolvedValue({ id: 1 }) },
        };
        return callback(txMock);
      });

      const result = await qcService.submitQcEvaluation(101, 1, {
        woServiceId: 1,
        items: [
          { itemName: 'Lực phanh đều 2 bên', result: QcResult.PASS },
          { itemName: 'Thử phanh không kêu', result: QcResult.PASS },
        ],
      });

      expect(result.overallResult).toBe(QcResult.PASS);
      expect(result.totalEvaluated).toBe(2);
      expect(result.failCount).toBe(0);
      expect(result.createdReworkJobs.length).toBe(0);
    });

    it('QC-02: Đánh giá có hạng mục FAIL -> overallResult là FAIL và tự động sinh Job Rework', async () => {
      const mockWorkOrder = {
        id: 101,
        status: WorkOrderStatus.IN_PROGRESS,
        services: [{ id: 1, name: 'Cân chỉnh thước lái', status: ServiceStatus.IN_PROGRESS }],
      };

      const createdReworkJob = {
        id: 88,
        name: '[Sửa lại - QC] Độ chụm bánh trước',
        status: JobStatus.REWORK,
        is_rework: true,
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: { findUnique: vi.fn().mockResolvedValue(mockWorkOrder) },
          qcRecord: {
            create: vi.fn().mockResolvedValue({ id: 502, overall_result: QcResult.FAIL }),
          },
          qcItem: {
            create: vi.fn().mockResolvedValue({ id: 1002, result: QcResult.FAIL }),
          },
          job: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(createdReworkJob),
            updateMany: vi.fn(),
          },
          woService: {
            update: vi.fn().mockResolvedValue({ id: 1, status: ServiceStatus.IN_PROGRESS }),
          },
          jobType: { findFirst: vi.fn().mockResolvedValue({ id: 1 }) },
          jobLabour: { create: vi.fn().mockResolvedValue({ id: 10 }) },
        };
        return callback(txMock);
      });

      const result = await qcService.submitQcEvaluation(101, 1, {
        woServiceId: 1,
        items: [
          {
            itemName: 'Độ chụm bánh trước',
            result: QcResult.FAIL,
            notes: 'Lệch 2 độ bên phụ',
            assignedEmployeeId: 5,
          },
        ],
      });

      expect(result.overallResult).toBe(QcResult.FAIL);
      expect(result.failCount).toBe(1);
      expect(result.createdReworkJobs.length).toBe(1);
      expect(result.createdReworkJobs[0].is_rework).toBe(true);
    });

    it('QC-03: Chặn kiểm định QC nếu phiếu công việc không ở trạng thái IN_PROGRESS', async () => {
      const mockWorkOrder = {
        id: 101,
        status: WorkOrderStatus.DRAFT,
        services: [],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: { findUnique: vi.fn().mockResolvedValue(mockWorkOrder) },
        };
        return callback(txMock);
      });

      await expect(
        qcService.submitQcEvaluation(101, 1, {
          woServiceId: 1,
          items: [{ itemName: 'Test item', result: QcResult.PASS }],
        })
      ).rejects.toThrow('chỉ có thể kiểm định QC khi đang thi công');
    });

    it('QC-06: Chống sinh trùng lặp Rework (Idempotency Guardrail) - Cập nhật Job Rework cũ thay vì tạo mới khi lưu nhiều lần', async () => {
      const mockWorkOrder = {
        id: 101,
        status: WorkOrderStatus.IN_PROGRESS,
        services: [{ id: 1, name: 'Sơn dặm', status: ServiceStatus.IN_PROGRESS }],
      };

      const existingReworkJob = {
        id: 99,
        name: '[Sửa lại - KCS] Bề mặt phẳng đều',
        status: JobStatus.REWORK,
        is_rework: true,
        labours: [{ id: 1, employee_id: 5 }],
      };

      const jobCreateSpy = vi.fn();
      const jobUpdateSpy = vi.fn().mockResolvedValue({ ...existingReworkJob, description: 'Ghi chú mới' });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: { findUnique: vi.fn().mockResolvedValue(mockWorkOrder) },
          qcRecord: {
            create: vi.fn().mockResolvedValue({ id: 503, overall_result: QcResult.FAIL }),
          },
          qcItem: {
            create: vi.fn().mockResolvedValue({ id: 1003, result: QcResult.FAIL }),
          },
          job: {
            findFirst: vi.fn().mockResolvedValue(existingReworkJob),
            create: jobCreateSpy,
            update: jobUpdateSpy,
            updateMany: vi.fn(),
          },
          woService: {
            update: vi.fn().mockResolvedValue({ id: 1, status: ServiceStatus.IN_PROGRESS }),
          },
          jobType: { findFirst: vi.fn().mockResolvedValue({ id: 1 }) },
          jobLabour: { update: vi.fn(), create: vi.fn() },
        };
        return callback(txMock);
      });

      const result = await qcService.submitQcEvaluation(101, 1, {
        woServiceId: 1,
        items: [
          {
            itemName: 'Bề mặt phẳng đều',
            result: QcResult.FAIL,
            notes: 'Ghi chú mới',
          },
        ],
      });

      // Kiểm tra: KHÔNG được gọi job.create, mà PHẢI gọi job.update
      expect(jobCreateSpy).not.toHaveBeenCalled();
      expect(jobUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 99 },
          data: expect.objectContaining({ rework_source_qc_item_id: 1003 }),
        })
      );
      expect(result.createdReworkJobs.length).toBe(1);
    });
  });

  describe('requestBilling()', () => {
    it('QC-04: Kích hoạt Billing Gate thành công khi 100% services PASS và không còn Rework', async () => {
      const mockWorkOrder = {
        id: 101,
        wo_number: 'WO-20261102-001',
        status: WorkOrderStatus.IN_PROGRESS,
        quotations: [{ id: 1, status: 'APPROVED' }],
        services: [
          {
            id: 1,
            name: 'Thay dầu',
            jobs: [{ id: 10, status: JobStatus.PASSED }],
            qc_records: [{ overall_result: QcResult.PASS }],
          },
        ],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: {
            findUnique: vi.fn().mockResolvedValue(mockWorkOrder),
            update: vi.fn().mockResolvedValue({
              id: 101,
              wo_number: 'WO-20261102-001',
              status: WorkOrderStatus.BILLING_REQUESTED,
              vehicle: { license_plate: '51F-123.45' },
              customer: { full_name: 'Nguyễn Văn A' },
            }),
          },
          notification: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        };
        return callback(txMock);
      });

      const res = await qcService.requestBilling(101, 1);
      expect(res.status).toBe(WorkOrderStatus.BILLING_REQUESTED);
    });

    it('QC-05: Chặn kích hoạt Billing Gate nếu có dịch vụ chưa đạt chuẩn QC', async () => {
      const mockWorkOrder = {
        id: 101,
        status: WorkOrderStatus.IN_PROGRESS,
        quotations: [{ id: 1 }],
        services: [
          {
            id: 1,
            name: 'Bảo dưỡng hệ thống làm mát',
            jobs: [{ id: 10, status: JobStatus.COMPLETED }],
            qc_records: [{ overall_result: QcResult.FAIL }],
          },
        ],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          workOrder: { findUnique: vi.fn().mockResolvedValue(mockWorkOrder) },
        };
        return callback(txMock);
      });

      await expect(qcService.requestBilling(101, 1)).rejects.toThrow(
        'chưa đạt kiểm định chất lượng'
      );
    });
  });
});

