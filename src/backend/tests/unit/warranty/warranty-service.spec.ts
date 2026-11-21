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
    },
  };
  return { prismaMock: mock };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { WarrantyService } from '../../../src/services/warranty.service';

describe('Unit Tests - Phân hệ Bảo hành (UC-81 & UC-83)', () => {
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
        customer_id: 100, // Thuộc về khách 100
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });

      // User ID 200 (vai trò CUSTOMER) cố truy cập
      await expect(
        warrantyService.checkVehicleWarrantyEligibility(
          { vehicleId: 10 },
          undefined,
          { userId: 200, roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow('Bạn không có quyền truy cập dữ liệu bảo hành của phương tiện này.');
    });

    it('cho phép nhân viên xưởng (STAFF / ADVISOR / MANAGER) tra cứu xe của bất kỳ khách hàng nào', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const result = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        undefined,
        { userId: 5, roles: ['SERVICE_ADVISOR'] }
      );

      expect(result.hasHistory).toBe(false);
      expect(result.message).toContain('Xe chưa có lịch sử dịch vụ hoặc phụ tùng bảo hành');
    });

    it('thông báo xe chưa có lịch sử dịch vụ hoặc phụ tùng khi chưa có phiếu sửa chữa nào hoàn thành (Luồng ngoại lệ)', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const result = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 10 });

      expect(result.hasHistory).toBe(false);
      expect(result.message).toBe('Xe chưa có lịch sử dịch vụ hoặc phụ tùng bảo hành tại trung tâm.');
      expect(result.items).toHaveLength(0);
      expect(result.summary.totalItems).toBe(0);
    });

    it('tính toán chính xác thời hạn và số km còn lại cho dịch vụ và phụ tùng còn hạn (VALID - Còn bảo hành)', async () => {
      // Giả lập xe vừa xuất xưởng 1 tháng trước (còn hạn 6 tháng / 10.000 km)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 50,
          wo_number: 'WO-00050',
          vehicle_id: 10,
          status: 'CLOSED',
          release: {
            released_at: oneMonthAgo,
            odometer_at_release: 10000,
          },
          services: [
            {
              id: 1,
              name: 'Bảo dưỡng định kỳ cấp 10.000 km',
              warranty_months: 6,
              warranty_mileage: 10000,
              jobs: [
                {
                  id: 101,
                  parts: [
                    {
                      id: 201,
                      item_id: 301,
                      status: 'USED',
                      warranty_months: 6,
                      warranty_mileage: 10000,
                      item: {
                        sku: 'OIL-FLT-01',
                        part_category: { name: 'Lọc dầu động cơ' },
                        brand: { name: 'Toyota Genuine' },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      // Hiện tại xe đi được 12.000 km (đã đi thêm 2.000 km, còn 8.000 km bảo hành)
      const currentOdo = 12000;
      const result = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: 10 }, currentOdo);

      expect(result.hasHistory).toBe(true);
      expect(result.items).toHaveLength(2); // 1 Service + 1 Part

      // Kiểm tra Service
      const svcItem = result.items.find((i) => i.type === 'SERVICE')!;
      expect(svcItem.status).toBe('VALID');
      expect(svcItem.statusLabel).toBe('Còn bảo hành');
      expect(svcItem.isValid).toBe(true);
      expect(svcItem.daysRemaining).toBeGreaterThan(120); // còn tầm ~150 ngày
      expect(svcItem.kmRemaining).toBe(8000); // 10000 + 10000 - 12000 = 8000 km

      // Kiểm tra Part
      const partItem = result.items.find((i) => i.type === 'PART')!;
      expect(partItem.status).toBe('VALID');
      expect(partItem.statusLabel).toBe('Còn bảo hành');
      expect(partItem.kmRemaining).toBe(8000);

      expect(result.summary.validItems).toBe(2);
      expect(result.summary.expiredItems).toBe(0);
    });

    it('nhận diện chính xác trường hợp quá hạn nhẹ (OVERDUE_LIGHT) khi quá hạn <= 30 ngày hoặc <= 1000 km', async () => {
      // Giả lập xe làm dịch vụ 6 tháng + 10 ngày trước (quá hạn 10 ngày)
      const sixMonthsTenDaysAgo = new Date();
      sixMonthsTenDaysAgo.setMonth(sixMonthsTenDaysAgo.getMonth() - 6);
      sixMonthsTenDaysAgo.setDate(sixMonthsTenDaysAgo.getDate() - 10);

      prismaMock.vehicle.findFirst.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Honda',
        model: 'City',
      });

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 51,
          wo_number: 'WO-00051',
          vehicle_id: 10,
          status: 'RELEASED',
          release: {
            released_at: sixMonthsTenDaysAgo,
            odometer_at_release: 20000,
          },
          services: [
            {
              id: 2,
              name: 'Thay má phanh trước',
              warranty_months: 6,
              warranty_mileage: 10000,
              jobs: [],
            },
          ],
        },
      ]);

      const result = await warrantyService.checkVehicleWarrantyEligibility({ licensePlate: '51F-12345' }, 20500);

      expect(result.hasHistory).toBe(true);
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.isValid).toBe(false);
      expect(item.isOverdueLight).toBe(true);
      expect(item.status).toBe('OVERDUE_LIGHT');
      expect(item.statusLabel).toContain('Quá hạn nhẹ');
      expect(item.overdueDays).toBeGreaterThanOrEqual(9);
      expect(item.overdueDays).toBeLessThanOrEqual(12);
    });
  });

  describe('UC-83: validateOdoIntake (Chống tua lùi ODO)', () => {
    it('báo lỗi khi số km ODO tiếp nhận nhỏ hơn ODO xuất xưởng của phiếu trước', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 100,
        wo_number: 'WO-00100',
        vehicle_id: 15,
        release: {
          odometer_at_release: 35000,
        },
      });

      // Nhập ODO 34.000 km (< 35.000 km)
      await expect(
        warrantyService.validateOdoIntake(100, 34000)
      ).rejects.toThrow('Số ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước (35.000 km).');
    });

    it('chấp thuận khi số km ODO tiếp nhận lớn hơn hoặc bằng ODO xuất xưởng của phiếu trước', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 100,
        wo_number: 'WO-00100',
        vehicle_id: 15,
        vehicle: { id: 15, license_plate: '30A-99999' },
        release: {
          odometer_at_release: 35000,
        },
      });

      const result = await warrantyService.validateOdoIntake(100, 36200);

      expect(result.valid).toBe(true);
      expect(result.lastRecordedOdo).toBe(35000);
      expect(result.intakeOdo).toBe(36200);
      expect(result.odoDifference).toBe(1200);
    });
  });

  describe('UC-83: getCompletedWorkOrdersForVehicle', () => {
    it('trả về danh sách phiếu dịch vụ đã hoàn thành kèm ngày và ODO xuất xưởng', async () => {
      const releaseDate = new Date('2026-10-01T10:00:00Z');
      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 88,
          wo_number: 'WO-00088',
          status: 'CLOSED',
          order_type: 'NORMAL',
          release: {
            released_at: releaseDate,
            odometer_at_release: 15000,
          },
          services: [
            { id: 1, name: 'Thay dầu nhớt', warranty_months: 6, warranty_mileage: 5000 },
          ],
        },
      ]);

      const result = await warrantyService.getCompletedWorkOrdersForVehicle(20);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(88);
      expect(result[0].woNumber).toBe('WO-00088');
      expect(result[0].releaseOdo).toBe(15000);
      expect(result[0].services).toHaveLength(1);
    });
  });
});

