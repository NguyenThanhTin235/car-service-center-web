import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    workOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    checkIn: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    inspection: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    finding: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    woService: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    service: {
      findFirst: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    jobFinding: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    jobLabour: {
      deleteMany: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));
  return { prismaMock: mock };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { CheckInService } from '../../../src/services/check-in.service';
import { InspectionService } from '../../../src/services/inspection.service';

describe('SA Unit Tests - Check-In & Inspection (SA-CHK-UT, SA-INS-UT)', () => {
  const checkInService = new CheckInService();
  const inspectionService = new InspectionService();

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
  });

  describe('SA-CHK-UT-01: CheckInService.createOrUpdateCheckIn (saveCheckIn & validation)', () => {
    it('tạo mới check-in thành công và chuyển WorkOrder từ DRAFT sang IN_PLANNING', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 10,
        status: 'DRAFT',
        check_in: null,
      });
      const createdCheckIn = {
        id: 1,
        work_order_id: 10,
        mileage: 45000,
        fuel_level: 'HALF',
        complaint: 'Xe rung khi phanh',
        exterior_condition: 'Trầy nhẹ cản trước',
        status: 'PENDING_CONFIRMATION',
      };
      prismaMock.checkIn.create.mockResolvedValue(createdCheckIn);
      prismaMock.workOrder.update.mockResolvedValue({ id: 10, status: 'IN_PLANNING' });

      const result = await checkInService.createOrUpdateCheckIn(
        10,
        {
          mileage: 45000,
          fuel_level: 'HALF',
          complaint: 'Xe rung khi phanh',
          exterior_condition: 'Trầy nhẹ cản trước',
          evidence_urls: ['https://cdn.example.com/front.jpg'],
        },
        33
      );

      expect(result).toEqual(createdCheckIn);
      expect(prismaMock.checkIn.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            work_order_id: 10,
            mileage: 45000,
            fuel_level: 'HALF',
            status: 'PENDING_CONFIRMATION',
            created_by_id: 33,
          }),
        })
      );
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'IN_PLANNING' },
      });
    });

    it('cập nhật check-in đã tồn tại khi WorkOrder đang ở IN_PLANNING', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 10,
        status: 'IN_PLANNING',
        check_in: { id: 1, mileage: 45000, status: 'PENDING_CONFIRMATION' },
      });
      prismaMock.checkIn.update.mockResolvedValue({
        id: 1,
        mileage: 45120,
        exterior_condition: 'Cập nhật vết xước cửa trái',
      });

      const result = await checkInService.createOrUpdateCheckIn(
        10,
        {
          mileage: 45120,
          exterior_condition: 'Cập nhật vết xước cửa trái',
        },
        33
      );

      expect(result.mileage).toBe(45120);
      expect(prismaMock.checkIn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ mileage: 45120 }),
        })
      );
      expect(prismaMock.workOrder.update).not.toHaveBeenCalled();
    });

    it('từ chối tạo mới khi thiếu ODO (mileage) hoặc tình trạng ngoại thất', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 10,
        status: 'DRAFT',
        check_in: null,
      });

      await expect(
        checkInService.createOrUpdateCheckIn(
          10,
          {
            fuel_level: 'HALF',
            complaint: 'Bảo dưỡng định kỳ',
          },
          33
        )
      ).rejects.toThrow('Thiếu thông tin bắt buộc để tạo ghi nhận tình trạng xe.');
    });

    it('báo lỗi khi không tìm thấy WorkOrder', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue(null);

      await expect(
        checkInService.createOrUpdateCheckIn(
          999,
          {
            mileage: 1000,
            fuel_level: 'FULL',
            complaint: 'Kiểm tra',
            exterior_condition: 'Bình thường',
          },
          33
        )
      ).rejects.toThrow('Không tìm thấy phiếu công việc.');
    });
  });

  describe('SA-CHK-UT-02: CheckInService.confirmCheckIn & khóa sau khi duyệt báo giá', () => {
    it('xác nhận Check-in thành công (PENDING_CONFIRMATION -> CONFIRMED) và chuyển DRAFT -> IN_PLANNING', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 10,
        status: 'DRAFT',
        check_in: { id: 1, status: 'PENDING_CONFIRMATION' },
      });
      prismaMock.checkIn.update.mockResolvedValue({
        id: 1,
        status: 'CONFIRMED',
        confirmed_at: new Date(),
      });
      prismaMock.workOrder.update.mockResolvedValue({ id: 10, status: 'IN_PLANNING' });

      const result = await checkInService.confirmCheckIn(10);

      expect(result.status).toBe('CONFIRMED');
      expect(prismaMock.checkIn.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      });
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'IN_PLANNING' },
      });
    });

    it('chặn xác nhận lại nếu Check-in đã CONFIRMED', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 10,
        status: 'IN_PLANNING',
        check_in: { id: 1, status: 'CONFIRMED' },
      });

      await expect(checkInService.confirmCheckIn(10)).rejects.toThrow(
        'Tình trạng xe đã được xác nhận trước đó.'
      );
    });

    it('chặn cập nhật Check-in sau khi khách hàng đã duyệt báo giá (APPROVED/IN_PROGRESS/RELEASED/CLOSED)', async () => {
      for (const lockedStatus of ['APPROVED', 'IN_PROGRESS', 'BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED']) {
        prismaMock.workOrder.findUnique.mockResolvedValue({
          id: 10,
          status: lockedStatus,
          check_in: { id: 1, status: 'CONFIRMED' },
        });

        await expect(
          checkInService.createOrUpdateCheckIn(10, { mileage: 50000 }, 33)
        ).rejects.toThrow(`Không thể cập nhật thông tin tiếp nhận xe sau khi khách hàng đã xác nhận báo giá (trạng thái ${lockedStatus})`);
      }
    });
  });

  describe('SA-INS-UT-01: InspectionService.addFinding & updateFinding', () => {
    it('tạo Finding mới, tự động khởi tạo Inspection và hạng mục WoService tương ứng', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 20,
        status: 'IN_PLANNING',
        advisor_id: 33,
      });
      prismaMock.inspection.findFirst.mockResolvedValue(null);
      prismaMock.inspection.create.mockResolvedValue({
        id: 5,
        work_order_id: 20,
        status: 'IN_PROGRESS',
        findings: [],
      });
      const createdFinding = {
        id: 101,
        inspection_id: 5,
        marker_type: 'DENT',
        part_name: 'Cửa trước trái',
        severity: 'HIGH',
        status: 'NEW',
      };
      prismaMock.finding.create.mockResolvedValue(createdFinding);
      prismaMock.woService.findFirst.mockResolvedValue(null);
      prismaMock.woService.aggregate.mockResolvedValue({ _max: { sort_order: 1 } });
      prismaMock.service.findFirst.mockResolvedValue({ id: 77 });
      prismaMock.woService.create.mockResolvedValue({ id: 200 });

      const result = await inspectionService.addFinding(20, 33, {
        marker_type: 'DENT',
        part_id: 'front_left_door',
        part_name: 'Cửa trước trái',
        coordinates: { x: 120, y: 85 },
        description: 'Móp nhẹ góc dưới',
        severity: 'HIGH',
      });

      expect(result).toEqual(createdFinding);
      expect(prismaMock.inspection.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.woService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            work_order_id: 20,
            service_id: 77,
            name: 'Khắc phục lỗi: Móp méo tại Cửa trước trái',
            sort_order: 2,
          }),
        })
      );
    });

    it('chặn thêm Finding khi WorkOrder đã RELEASED, CLOSED hoặc CANCELLED', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 20,
        status: 'RELEASED',
      });

      await expect(
        inspectionService.addFinding(20, 33, {
          marker_type: 'SCRATCH',
          part_id: 'bumper',
          part_name: 'Cản sau',
          coordinates: { x: 10, y: 20 },
        })
      ).rejects.toThrow('Không thể chỉnh sửa kiểm tra xe.');
    });

    it('cập nhật Finding và liên kết job_id thành công', async () => {
      prismaMock.finding.findUnique.mockResolvedValue({
        id: 101,
        inspection: { work_order: { id: 20, status: 'IN_PLANNING' } },
        job_findings: [],
      });
      prismaMock.job.findUnique.mockResolvedValue({ id: 55, name: 'Gò sơn cửa' });
      prismaMock.jobFinding.findFirst.mockResolvedValue(null);
      prismaMock.jobFinding.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.jobFinding.create.mockResolvedValue({ id: 1, finding_id: 101, job_id: 55 });
      prismaMock.finding.update.mockResolvedValue({
        id: 101,
        description: 'Đã cập nhật mô tả',
        severity: 'CRITICAL',
      });

      const updated = await inspectionService.updateFinding(101, {
        description: 'Đã cập nhật mô tả',
        severity: 'CRITICAL',
        job_id: 55,
      });

      expect(updated.severity).toBe('CRITICAL');
      expect(prismaMock.jobFinding.create).toHaveBeenCalledWith({
        data: { finding_id: 101, job_id: 55 },
      });
    });
  });

  describe('SA-INS-UT-02: InspectionService.deleteFinding guard khi liên kết Job', () => {
    it('từ chối xóa Finding khi đã liên kết với Job đang thực hiện (IN_PROGRESS)', async () => {
      prismaMock.finding.findUnique.mockResolvedValue({
        id: 101,
        marker_type: 'DENT',
        part_name: 'Cửa trước trái',
        inspection: { work_order_id: 20, work_order: { status: 'IN_PROGRESS' } },
        job_findings: [
          {
            id: 1,
            job_id: 55,
            job: { id: 55, name: 'Gò nắn cửa', status: 'IN_PROGRESS', labours: [] },
          },
        ],
      });

      await expect(inspectionService.deleteFinding(101)).rejects.toThrow(
        'Không thể xóa: Vết lỗi đã có công việc (Gò nắn cửa) được phân công hoặc đang thực hiện.'
      );
      expect(prismaMock.finding.delete).not.toHaveBeenCalled();
    });

    it('từ chối xóa Finding khi Job ở trạng thái PLANNED nhưng đã phân công kỹ thuật viên (employee_id !== null)', async () => {
      prismaMock.finding.findUnique.mockResolvedValue({
        id: 102,
        marker_type: 'SCRATCH',
        part_name: 'Cản trước',
        inspection: { work_order_id: 20, work_order: { status: 'IN_PLANNING' } },
        job_findings: [
          {
            id: 2,
            job_id: 56,
            job: {
              id: 56,
              name: 'Sơn dặm cản trước',
              status: 'PLANNED',
              labours: [{ id: 9, employee_id: 12 }],
            },
          },
        ],
      });

      await expect(inspectionService.deleteFinding(102)).rejects.toThrow(
        'Không thể xóa: Vết lỗi đã có công việc (Sơn dặm cản trước) được phân công hoặc đang thực hiện.'
      );
      expect(prismaMock.finding.delete).not.toHaveBeenCalled();
    });

    it('cho phép xóa Finding khi Job ở trạng thái PLANNED và chưa phân công thợ, đồng thời dọn dẹp WoService tự tạo', async () => {
      prismaMock.finding.findUnique.mockResolvedValue({
        id: 103,
        marker_type: 'DENT',
        part_name: 'Cửa sau',
        inspection: { work_order_id: 20, work_order: { status: 'IN_PLANNING' } },
        job_findings: [
          {
            id: 3,
            job_id: 57,
            job: {
              id: 57,
              name: 'Gò cửa sau',
              status: 'PLANNED',
              labours: [{ id: 10, employee_id: null }],
            },
          },
        ],
      });
      prismaMock.jobFinding.delete.mockResolvedValue({});
      prismaMock.jobFinding.count.mockResolvedValue(0);
      prismaMock.jobLabour.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.job.delete.mockResolvedValue({});
      prismaMock.woService.findFirst.mockResolvedValue({
        id: 300,
        jobs: [],
      });
      prismaMock.woService.delete.mockResolvedValue({});
      prismaMock.finding.delete.mockResolvedValue({ id: 103 });

      const result = await inspectionService.deleteFinding(103);

      expect(result.id).toBe(103);
      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 57 } });
      expect(prismaMock.woService.delete).toHaveBeenCalledWith({ where: { id: 300 } });
      expect(prismaMock.finding.delete).toHaveBeenCalledWith({ where: { id: 103 } });
    });
  });
});
