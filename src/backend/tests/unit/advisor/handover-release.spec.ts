import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock, notificationMock } = vi.hoisted(() => {
  const mock: any = {
    workOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vehicleRelease: {
      upsert: vi.fn(),
    },
    jobPart: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  const notif = {
    sendEmail: vi.fn().mockResolvedValue(undefined),
  };

  return { prismaMock: mock, notificationMock: notif };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: notificationMock,
}));

import { WorkOrderService } from '../../../src/services/work-order.service';

describe('SA Unit Tests - Handover, Cancel-Release & Close (SA-REL-UT)', () => {
  const workOrderService = new WorkOrderService();

  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    notificationMock.sendEmail.mockResolvedValue(undefined);
  });

  describe('SA-REL-UT-01: completeHandover (Financial Gate + ODO Gate + Signature)', () => {
    it('chặn bàn giao xe khi chưa ở trạng thái FINANCIAL_CLEARED (Financial Gate)', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'BILLING_REQUESTED',
        check_in: { mileage: 30000, fuel_level: 'HALF' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Camry' },
        customer: { id: 88, full_name: 'Nguyễn Văn A', email: 'a@test.vn' },
        invoices: [],
        services: [],
      });

      await expect(
        workOrderService.completeHandover(50, 33, {
          returnMileage: 30050,
          customerSignature: 'data:image/png;base64,abc',
        })
      ).rejects.toThrow('Phương tiện chưa hoàn tất quyết toán tài chính (Financial Clearance)');
    });

    it('chặn bàn giao xe khi returnMileage nhỏ hơn ODO lúc tiếp nhận (check_in.mileage)', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'FINANCIAL_CLEARED',
        check_in: { mileage: 30000, fuel_level: 'HALF' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Camry' },
        customer: { id: 88, full_name: 'Nguyễn Văn A', email: 'a@test.vn' },
        invoices: [],
        services: [],
      });

      await expect(
        workOrderService.completeHandover(50, 33, {
          returnMileage: 29500,
          customerSignature: 'data:image/png;base64,abc',
        })
      ).rejects.toThrow('Số ODO xuất xưởng (29500 km) không được nhỏ hơn ODO tiếp nhận (30000 km).');
    });

    it('chặn bàn giao lại nếu WorkOrder đã RELEASED hoặc CLOSED', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'RELEASED',
        check_in: { mileage: 30000 },
        services: [],
      });

      await expect(
        workOrderService.completeHandover(50, 33, { returnMileage: 30010 })
      ).rejects.toThrow('Phiếu công việc đã ở trạng thái RELEASED, không thể thực hiện bàn giao lại.');
    });

    it('bàn giao xe thành công khi FINANCIAL_CLEARED, ODO hợp lệ và lưu chữ ký khách hàng', async () => {
      const baseWo = {
        id: 50,
        wo_number: 'WO-261116-001',
        status: 'FINANCIAL_CLEARED',
        customer_id: 88,
        check_in: { mileage: 30000, fuel_level: 'HALF' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Camry' },
        customer: { id: 88, full_name: 'Nguyễn Văn A', email: 'a@test.vn' },
        advisor: { id: 33, full_name: 'Hoàng Cố Vấn' },
        release: null,
        invoices: [{ status: 'PAID', payments: [] }],
        services: [{ jobs: [{ status: 'COMPLETED', parts: [{ status: 'ISSUED' }] }] }],
      };

      const releasedWo = { ...baseWo, status: 'RELEASED', release: { id: 7 } };
      const closedWo = { ...releasedWo, status: 'CLOSED', close_type: 'AUTO' };

      // Lần 1: completeHandover đọc WO; Lần 2: tryAutoClose -> closeWorkOrderInTx đọc WO sau khi đã RELEASED
      prismaMock.workOrder.findUnique
        .mockResolvedValueOnce(baseWo)
        .mockResolvedValueOnce(releasedWo);

      prismaMock.vehicleRelease.upsert.mockImplementation(async (args: any) => ({
        id: 7,
        ...args.create,
      }));
      prismaMock.workOrder.update
        .mockResolvedValueOnce(releasedWo)
        .mockResolvedValueOnce(closedWo);
      prismaMock.notification.create.mockResolvedValue({ id: 1 });

      const result = await workOrderService.completeHandover(50, 33, {
        returnMileage: 30025,
        returnFuel: 'THREE_QUARTER',
        oldPartsAction: 'RETURNED_TO_CUSTOMER',
        carWashCompleted: true,
        belongingsReturned: true,
        notes: 'Xe sạch sẽ, khách hài lòng',
        customerSignature: 'data:image/png;base64,signed123',
      });

      expect(result.success).toBe(true);
      expect(prismaMock.vehicleRelease.upsert).toHaveBeenCalledTimes(1);
      const upsertArg = prismaMock.vehicleRelease.upsert.mock.calls[0][0];
      const parsedNotes = JSON.parse(upsertArg.create.release_notes);
      expect(parsedNotes.returnMileage).toBe(30025);
      expect(parsedNotes.customerSignature).toBe('data:image/png;base64,signed123');
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 50 },
          data: { status: 'RELEASED' },
        })
      );
      expect(notificationMock.sendEmail).toHaveBeenCalledWith(
        'a@test.vn',
        expect.stringContaining('51F-123.45'),
        expect.any(String)
      );
    });
  });

  describe('SA-REL-UT-02: cancelAndReleaseWorkOrder', () => {
    it('giải phóng phụ tùng RESERVED -> RETURNED, tạo VehicleRelease và chuyển WO sang RELEASED', async () => {
      const woInPlanning = {
        id: 60,
        wo_number: 'WO-261116-002',
        status: 'IN_PLANNING',
        customer_id: 88,
        check_in: { mileage: 12000 },
        vehicle: { license_plate: '51G-888.99', make: 'Honda', model: 'Civic' },
        customer: { id: 88, full_name: 'Trần B', email: 'b@test.vn' },
        advisor: { id: 33, full_name: 'Hoàng Cố Vấn' },
        release: null,
        services: [
          {
            jobs: [
              {
                id: 1,
                status: 'PLANNED',
                parts: [
                  { id: 501, status: 'RESERVED' },
                  { id: 502, status: 'RETURNED' },
                ],
              },
            ],
          },
        ],
      };
      const releasedWo = { ...woInPlanning, status: 'RELEASED', release: { id: 8 }, invoices: [] };

      prismaMock.workOrder.findUnique
        .mockResolvedValueOnce(woInPlanning)
        .mockResolvedValueOnce(releasedWo);
      prismaMock.jobPart.update.mockResolvedValue({ id: 501, status: 'RETURNED' });
      prismaMock.vehicleRelease.upsert.mockImplementation(async (args: any) => ({
        id: 8,
        ...args.create,
      }));
      prismaMock.workOrder.update.mockResolvedValueOnce(releasedWo);
      prismaMock.notification.create.mockResolvedValue({ id: 2 });

      const result = await workOrderService.cancelAndReleaseWorkOrder(60, 33, {
        releaseNotes: 'Khách từ chối báo giá sửa chữa',
        diagnosticFee: 250000,
        mileage: 12005,
        fuelLevel: 'HALF',
      });

      expect(result.success).toBe(true);
      expect(prismaMock.jobPart.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.jobPart.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: { status: 'RETURNED' },
      });
      const upsertArg = prismaMock.vehicleRelease.upsert.mock.calls[0][0];
      expect(upsertArg.create.release_notes).toContain('Khách từ chối báo giá sửa chữa');
      expect(upsertArg.create.release_notes).toContain('250.000 đ');
      expect(upsertArg.create.release_notes).toContain('12.005 km');
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 60 },
          data: { status: 'RELEASED' },
        })
      );
    });

    it('chặn xuất trả xe nếu WorkOrder đã RELEASED hoặc CLOSED', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 60,
        status: 'CLOSED',
        services: [],
      });

      await expect(
        workOrderService.cancelAndReleaseWorkOrder(60, 33, {})
      ).rejects.toThrow('Phiếu công việc đã ở trạng thái CLOSED, không thể thực hiện xuất trả xe.');
    });
  });

  describe('SA-REL-UT-03: closeWorkOrder (RELEASED -> CLOSED)', () => {
    it('đóng hồ sơ thành công khi WO ở trạng thái RELEASED, có biên bản bàn giao, không còn Job/Part treo và hóa đơn đã PAID', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 70,
        wo_number: 'WO-261116-003',
        status: 'RELEASED',
        customer_id: 88,
        release: { id: 9 },
        vehicle: { license_plate: '51H-555.66' },
        invoices: [{ status: 'PAID' }, { status: 'CANCELLED' }],
        services: [
          {
            jobs: [
              {
                status: 'COMPLETED',
                parts: [{ status: 'ISSUED' }],
              },
            ],
          },
        ],
      });
      prismaMock.workOrder.update.mockResolvedValue({
        id: 70,
        status: 'CLOSED',
        close_type: 'MANUAL',
        close_notes: 'Hoàn tất lưu trữ hồ sơ',
      });
      prismaMock.notification.create.mockResolvedValue({ id: 3 });

      const result = await workOrderService.closeWorkOrder(70, 33, 'Hoàn tất lưu trữ hồ sơ');

      expect(result.status).toBe('CLOSED');
      expect(result.close_type).toBe('MANUAL');
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 70 },
          data: expect.objectContaining({
            status: 'CLOSED',
            closed_by_id: 33,
            close_type: 'MANUAL',
            close_notes: 'Hoàn tất lưu trữ hồ sơ',
          }),
        })
      );
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
    });

    it('chặn đóng hồ sơ nếu WorkOrder chưa ở trạng thái RELEASED', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 70,
        status: 'FINANCIAL_CLEARED',
        release: null,
        vehicle: { license_plate: '51H-555.66' },
        invoices: [],
        services: [],
      });

      await expect(workOrderService.closeWorkOrder(70, 33)).rejects.toThrow(
        'Chỉ có thể đóng hồ sơ khi xe đã bàn giao (RELEASED). Trạng thái hiện tại: FINANCIAL_CLEARED.'
      );
    });

    it('chặn đóng hồ sơ nếu còn Job IN_PROGRESS hoặc phụ tùng RESERVED hoặc hóa đơn chưa PAID', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 70,
        status: 'RELEASED',
        release: { id: 9 },
        vehicle: { license_plate: '51H-555.66' },
        invoices: [{ status: 'PAID' }],
        services: [{ jobs: [{ status: 'IN_PROGRESS', parts: [] }] }],
      });
      await expect(workOrderService.closeWorkOrder(70, 33)).rejects.toThrow(
        'Còn 1 công việc đang thực hiện. Không thể đóng hồ sơ.'
      );

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 70,
        status: 'RELEASED',
        release: { id: 9 },
        vehicle: { license_plate: '51H-555.66' },
        invoices: [{ status: 'PAID' }],
        services: [{ jobs: [{ status: 'COMPLETED', parts: [{ status: 'RESERVED' }] }] }],
      });
      await expect(workOrderService.closeWorkOrder(70, 33)).rejects.toThrow(
        'Còn 1 phụ tùng đang giữ chỗ. Vui lòng giải phóng trước khi đóng hồ sơ.'
      );

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 70,
        status: 'RELEASED',
        release: { id: 9 },
        vehicle: { license_plate: '51H-555.66' },
        invoices: [{ status: 'UNPAID' }],
        services: [{ jobs: [{ status: 'COMPLETED', parts: [] }] }],
      });
      await expect(workOrderService.closeWorkOrder(70, 33)).rejects.toThrow(
        'Hóa đơn chưa được thanh toán đầy đủ. Không thể đóng hồ sơ.'
      );
    });
  });
});
