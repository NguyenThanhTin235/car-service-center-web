import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    vehicle: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prismaMock: mock };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { WarrantyService } from '../../../src/services/warranty.service';

describe('Unit Tests - Phân hệ Bảo hành theo Tháng (UC-81 & UC-83)', () => {
  const warrantyService = new WarrantyService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UC-81: checkVehicleWarrantyEligibility', () => {
    it('báo lỗi khi không tìm thấy phương tiện trong hệ thống', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 9999 })
      ).rejects.toThrow('Không tìm thấy phương tiện trong hệ thống.');
    });

    it('chặn khách hàng tra cứu xe không thuộc quyền sở hữu của mình (RBAC Customer)', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });

      await expect(
        warrantyService.checkVehicleWarrantyEligibility(
          { vehicleId: 10 },
          { userId: 200, roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow('Bạn không có quyền truy cập dữ liệu bảo hành của phương tiện này.');
    });

    it('cho phép nhân viên xưởng (DESK STAFF / SA / MANAGER) tra cứu xe của bất kỳ khách hàng nào', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const deskStaffResult = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        { userId: 500, roles: ['DESK STAFF'] }
      );
      expect(deskStaffResult.hasHistory).toBe(false);

      const saResult = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        { userId: 501, roles: ['SA'] }
      );
      expect(saResult.hasHistory).toBe(false);
    });

    it('tính chính xác trạng thái VALID (Còn hạn) và EXPIRED (Quá hạn) chỉ dựa theo tháng', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-555.66',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'Đen',
        customer: { id: 100, full_name: 'Nguyễn Văn Minh', phone: '0908111222' },
      });

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 101,
          wo_number: 'WO-2026-101',
          created_at: oneMonthAgo,
          updated_at: oneMonthAgo,
          release: { released_at: oneMonthAgo },
          services: [
            {
              id: 1,
              name: 'Thay dầu động cơ 5W-30',
              warranty_months: 6,
              service: { id: 10, name: 'Thay dầu động cơ 5W-30', warranty_months: 6 },
              jobs: [
                {
                  parts: [
                    {
                      id: 201,
                      item_id: 50,
                      status: 'USED',
                      warranty_months: 12,
                      item: {
                        sku: 'OIL-5W30',
                        warranty_months: 12,
                        part_category: { id: 1, name: 'Lọc nhớt chính hãng', code: 'FLT' },
                        brand: { id: 1, name: 'Toyota' },
                      },
                    },
                    {
                      id: 202,
                      item_id: 51,
                      status: 'RETURNED',
                      warranty_months: 12,
                      item: {
                        sku: 'RET-01',
                        warranty_months: 12,
                        part_category: { id: 2, name: 'Phụ tùng trả kho', code: 'RET' },
                        brand: null,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 99,
          wo_number: 'WO-2026-099',
          created_at: eightMonthsAgo,
          updated_at: eightMonthsAgo,
          release: { released_at: eightMonthsAgo },
          services: [
            {
              id: 2,
              name: 'Cân chỉnh thước lái',
              warranty_months: 6,
              service: { id: 11, name: 'Cân chỉnh thước lái', warranty_months: 6 },
              jobs: [],
            },
          ],
        },
      ]);

      const result = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 10 });

      expect(result.hasHistory).toBe(true);
      expect(result.summary.totalItems).toBe(3); // Không tính phụ tùng RETURNED
      expect(result.summary.validItems).toBe(2);
      expect(result.summary.expiredItems).toBe(1);

      const validSvc = result.items.find((i) => i.type === 'SERVICE' && i.id === 1);
      expect(validSvc?.status).toBe('VALID');
      expect(validSvc?.statusLabel).toBe('Còn hạn');
      expect(validSvc?.daysRemaining).toBeGreaterThan(0);

      const expiredSvc = result.items.find((i) => i.type === 'SERVICE' && i.id === 2);
      expect(expiredSvc?.status).toBe('EXPIRED');
      expect(expiredSvc?.statusLabel).toBe('Quá hạn');
      expect(expiredSvc?.overdueDays).toBeGreaterThan(0);
      expect(expiredSvc?.daysRemaining).toBe(0);
    });

    it('hỗ trợ tra cứu linh hoạt theo biển số xe (licensePlate)', async () => {
      prismaMock.vehicle.findFirst.mockResolvedValue({
        id: 15,
        customer_id: 100,
        license_plate: '51H-999.88',
        make: 'Honda',
        model: 'CR-V',
        customer: { id: 100, full_name: 'Trần Thị Hoa', phone: '0909333444' },
      });
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const res = await warrantyService.checkVehicleWarrantyEligibility({
        licensePlate: ' 51h-999.88 ',
      });
      expect(res.vehicle.licensePlate).toBe('51H-999.88');
      expect(prismaMock.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { license_plate: { equals: '51H-999.88' } },
        })
      );
    });

    it('dịch vụ trọn gói (FIXED / VEHICLE_SIZE) chỉ xét bảo hành dịch vụ, bỏ qua phụ tùng đi kèm', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 16,
        customer_id: 100,
        license_plate: '51K-111.22',
        make: 'Mazda',
        model: '3',
        customer: { id: 100, full_name: 'Lê Văn C', phone: '0909555666' },
      });

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 102,
          wo_number: 'WO-2026-102',
          created_at: oneMonthAgo,
          updated_at: oneMonthAgo,
          release: { released_at: oneMonthAgo },
          services: [
            {
              id: 3,
              name: 'Gói bảo dưỡng nhanh trọn gói',
              pricing_type: 'FIXED',
              warranty_months: 6,
              service: { id: 12, name: 'Gói bảo dưỡng nhanh trọn gói', warranty_months: 6 },
              jobs: [
                {
                  parts: [
                    {
                      id: 301,
                      item_id: 60,
                      status: 'USED',
                      warranty_months: 3,
                      item: {
                        sku: 'PKG-PART-01',
                        warranty_months: 3,
                        part_category: { id: 3, name: 'Lọc gió động cơ', code: 'AIR' },
                        brand: null,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const result = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 16 });
      expect(result.summary.totalItems).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('SERVICE');
      expect(result.items[0].warrantyMonths).toBe(6);
    });

    it('chính sách bảo hành 1 lần duy nhất: khi đơn bảo hành hoàn tất, đơn gốc chuyển sang EXPIRED và đơn bảo hành mới được áp dụng hạn mới', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 17,
        customer_id: 100,
        license_plate: '51L-222.33',
        make: 'Toyota',
        model: 'Camry',
        customer: { id: 100, full_name: 'Phạm Văn D', phone: '0909777888' },
      });

      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const today = new Date();

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 500,
          wo_number: 'WO-2026-500',
          order_type: 'REGULAR',
          parent_work_order_id: null,
          created_at: twoMonthsAgo,
          updated_at: twoMonthsAgo,
          release: { released_at: twoMonthsAgo },
          services: [
            {
              id: 51,
              name: 'Thay bugi',
              pricing_type: 'FIXED',
              warranty_months: 6,
              service: { id: 15, name: 'Thay bugi', warranty_months: 6 },
              jobs: [],
            },
          ],
        },
        {
          id: 501,
          wo_number: 'WO-2026-501',
          order_type: 'WARRANTY',
          parent_work_order_id: 500,
          created_at: today,
          updated_at: today,
          release: { released_at: today },
          services: [
            {
              id: 52,
              name: 'Thay bugi',
              pricing_type: 'FIXED',
              warranty_months: 6,
              service: { id: 15, name: 'Thay bugi', warranty_months: 6 },
              jobs: [],
            },
          ],
        },
      ]);

      const result = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 17 });
      const origItem = result.items.find((i) => i.workOrderId === 500);
      const warrantyItem = result.items.find((i) => i.workOrderId === 501);

      expect(origItem?.status).toBe('EXPIRED');
      expect(origItem?.statusLabel).toBe('Quá hạn');
      expect(origItem?.daysRemaining).toBe(0);

      expect(warrantyItem?.status).toBe('VALID');
      expect(warrantyItem?.statusLabel).toBe('Còn hạn');
      expect(warrantyItem?.daysRemaining).toBeGreaterThan(0);
    });
  });

  describe('UC-83: getCompletedWorkOrdersForVehicle', () => {
    it('trả về danh sách phiếu đã hoàn tất để nhân viên chọn phiếu gốc (không kèm ODO check)', async () => {
      const releasedAt = new Date('2026-10-01T10:00:00.000Z');
      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 201,
          wo_number: 'WO-2026-201',
          status: 'RELEASED',
          order_type: 'REGULAR',
          updated_at: releasedAt,
          release: { released_at: releasedAt },
          services: [{ id: 1, name: 'Bảo dưỡng điều hòa', warranty_months: 6 }],
        },
      ]);

      const orders = await warrantyService.getCompletedWorkOrdersForVehicle(10);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: 201,
        woNumber: 'WO-2026-201',
        servicesSummary: 'Bảo dưỡng điều hòa',
      });
      expect((orders[0] as any).releaseOdo).toBeUndefined();
    });
  });
});
