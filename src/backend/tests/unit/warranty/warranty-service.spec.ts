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
    goodwillClaim: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
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

    it('cho phép nhân viên xưởng (STAFF / ADVISOR / MANAGER / DESK STAFF / SA) tra cứu xe của bất kỳ khách hàng nào', async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 10,
        customer_id: 100,
        license_plate: '51F-12345',
        make: 'Toyota',
        model: 'Vios',
      });
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      // Test với vai trò DESK STAFF (Lễ tân quầy tiếp nhận)
      const deskStaffResult = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        undefined,
        { userId: 5, roles: ['DESK STAFF'] }
      );
      expect(deskStaffResult.hasHistory).toBe(false);

      // Test với vai trò SA (Cố vấn dịch vụ)
      const saResult = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        undefined,
        { userId: 6, roles: ['SA'] }
      );
      expect(saResult.hasHistory).toBe(false);

      // Test với vai trò MANAGER
      const managerResult = await warrantyService.checkVehicleWarrantyEligibility(
        { vehicleId: 10 },
        undefined,
        { userId: 7, roles: ['MANAGER'] }
      );
      expect(managerResult.hasHistory).toBe(false);
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

  describe('UC-86: Bảo hành thiện chí (Goodwill Claims)', () => {
    describe('createGoodwillClaim', () => {
      it('báo lỗi khi để trống nội dung phản ánh hiện tượng sự cố / lý do đề xuất', async () => {
        await expect(
          warrantyService.createGoodwillClaim(
            {
              vehicleId: 10,
              parentWoId: 50,
              complaint: '   ',
            },
            1
          )
        ).rejects.toThrow('Vui lòng nhập mô tả hiện tượng sự cố phản ánh và lý do đề xuất.');
      });

      it('báo lỗi khi không tìm thấy phương tiện', async () => {
        prismaMock.vehicle.findUnique.mockResolvedValue(null);

        await expect(
          warrantyService.createGoodwillClaim(
            {
              vehicleId: 9999,
              parentWoId: 50,
              complaint: 'Xe bị giật khi chuyển số, quá hạn bảo hành 5 ngày',
            },
            1
          )
        ).rejects.toThrow('Không tìm thấy phương tiện trong hệ thống.');
      });

      it('báo lỗi khi không tìm thấy phiếu dịch vụ gốc', async () => {
        prismaMock.vehicle.findUnique.mockResolvedValue({ id: 10, customer_id: 100 });
        prismaMock.workOrder.findUnique.mockResolvedValue(null);

        await expect(
          warrantyService.createGoodwillClaim(
            {
              vehicleId: 10,
              parentWoId: 9999,
              complaint: 'Xe bị giật khi chuyển số, quá hạn bảo hành 5 ngày',
            },
            1
          )
        ).rejects.toThrow('Không tìm thấy phiếu dịch vụ gốc.');
      });

      it('tạo yêu cầu bảo hành thiện chí thành công ở trạng thái PENDING', async () => {
        prismaMock.vehicle.findUnique.mockResolvedValue({ id: 10, customer_id: 100 });
        prismaMock.workOrder.findUnique.mockResolvedValue({ id: 50, wo_number: 'WO-00050' });

        const mockClaim = {
          id: 1,
          vehicle_id: 10,
          customer_id: 100,
          parent_wo_id: 50,
          overdue_days: 5,
          overdue_km: 200,
          complaint: 'Xe bị rung khi đạp phanh, quá hạn 5 ngày và 200km',
          status: 'PENDING',
          created_by_id: 15,
        };
        prismaMock.goodwillClaim.create.mockResolvedValue(mockClaim);

        const result = await warrantyService.createGoodwillClaim(
          {
            vehicleId: 10,
            parentWoId: 50,
            overdueDays: 5,
            overdueKm: 200,
            complaint: 'Xe bị rung khi đạp phanh, quá hạn 5 ngày và 200km',
          },
          15
        );

        expect(result.id).toBe(1);
        expect(result.status).toBe('PENDING');
        expect(prismaMock.goodwillClaim.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              vehicle_id: 10,
              parent_wo_id: 50,
              overdue_days: 5,
              overdue_km: 200,
              status: 'PENDING',
              created_by_id: 15,
            }),
          })
        );
      });
    });

    describe('listGoodwillClaims', () => {
      it('lọc danh sách yêu cầu theo trạng thái PENDING và phân trang chuẩn', async () => {
        prismaMock.goodwillClaim.findMany.mockResolvedValue([
          { id: 1, status: 'PENDING', complaint: 'Lỗi phát sinh' },
        ]);
        prismaMock.goodwillClaim.count.mockResolvedValue(1);

        const result = await warrantyService.listGoodwillClaims({
          status: 'PENDING' as any,
          page: 1,
          limit: 10,
        });

        expect(result.claims).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
        expect(result.pagination.totalPages).toBe(1);
      });
    });

    describe('getGoodwillClaimDetail', () => {
      it('báo lỗi nếu không tìm thấy hồ sơ', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue(null);

        await expect(warrantyService.getGoodwillClaimDetail(999)).rejects.toThrow(
          'Không tìm thấy hồ sơ yêu cầu bảo hành thiện chí.'
        );
      });

      it('trả về hồ sơ thẩm định toàn diện kèm thống kê khách hàng thân thiết (UC-86 Bước 3)', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 5,
          customer_id: 20,
          status: 'PENDING',
          complaint: 'Khách hàng thân thiết làm dịch vụ 5 lần tại xưởng',
          vehicle: { license_plate: '51G-88888' },
          parent_wo: { wo_number: 'WO-00050' },
        });
        prismaMock.workOrder.findMany.mockResolvedValue([
          { id: 1, wo_number: 'WO-01' },
          { id: 2, wo_number: 'WO-02' },
          { id: 3, wo_number: 'WO-03' },
          { id: 4, wo_number: 'WO-04' },
        ]);
        prismaMock.workOrder.count.mockResolvedValue(4);

        const result = await warrantyService.getGoodwillClaimDetail(5);

        expect(result.claim.id).toBe(5);
        expect(result.customerStats.totalCompletedOrders).toBe(4);
        expect(result.customerStats.isLoyalCustomer).toBe(true);
      });
    });

    describe('approveGoodwillClaim', () => {
      it('báo lỗi ngoại lệ khi quản lý để trống ghi chú giải trình phê duyệt (UC-86 Luồng ngoại lệ)', async () => {
        await expect(
          warrantyService.approveGoodwillClaim(1, 2, {
            supportType: 'FULL' as any,
            approvalNote: '   ',
          })
        ).rejects.toThrow('Vui lòng nhập lý do giải trình phê duyệt/từ chối');
      });

      it('báo lỗi khi hồ sơ không ở trạng thái PENDING', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 1,
          status: 'APPROVED',
        });

        await expect(
          warrantyService.approveGoodwillClaim(1, 2, {
            supportType: 'FULL' as any,
            approvalNote: 'Đồng ý hỗ trợ khách hàng',
          })
        ).rejects.toThrow('Hồ sơ bảo hành thiện chí này đã ở trạng thái APPROVED, không thể phê duyệt lại.');
      });

      it('báo lỗi khi chọn PERCENTAGE nhưng không nhập tỷ lệ hợp lệ (1-100%)', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 1,
          status: 'PENDING',
        });

        await expect(
          warrantyService.approveGoodwillClaim(1, 2, {
            supportType: 'PERCENTAGE' as any,
            supportPct: 150,
            approvalNote: 'Hỗ trợ 150%',
          })
        ).rejects.toThrow('Tỷ lệ phần trăm hỗ trợ thiện chí phải từ 1% đến 100%.');
      });

      it('phê duyệt thành công mức FULL (100% công + phụ tùng) và gửi thông báo cho Cố vấn (UC-86 Bước 7)', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 1,
          status: 'PENDING',
          created_by_id: 10,
        });

        prismaMock.goodwillClaim.update.mockResolvedValue({
          id: 1,
          status: 'APPROVED',
          support_type: 'FULL',
          approval_note: 'Khách hàng thân thiết, quá hạn 3 ngày do bận công tác',
          approved_by_id: 2,
          vehicle: { license_plate: '51F-12345' },
          customer: { full_name: 'Trần Văn A' },
          approved_by: { full_name: 'Quản lý Dịch vụ' },
        });

        const result = await warrantyService.approveGoodwillClaim(1, 2, {
          supportType: 'FULL' as any,
          approvalNote: 'Khách hàng thân thiết, quá hạn 3 ngày do bận công tác',
        });

        expect(result.status).toBe('APPROVED');
        expect(result.support_type).toBe('FULL');
        expect(prismaMock.goodwillClaim.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({
              status: 'APPROVED',
              support_type: 'FULL',
              approved_by_id: 2,
            }),
          })
        );
        expect(prismaMock.notification.create).toHaveBeenCalled();
      });

      it('phê duyệt thành công mức PERCENTAGE (giảm 50% chi phí)', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 2,
          status: 'PENDING',
          created_by_id: 10,
        });

        prismaMock.goodwillClaim.update.mockResolvedValue({
          id: 2,
          status: 'APPROVED',
          support_type: 'PERCENTAGE',
          support_pct: 50,
          approval_note: 'Hỗ trợ 50% tiền phụ tùng do lỗi hao mòn sớm',
          approved_by_id: 2,
          vehicle: { license_plate: '51F-12345' },
          customer: { full_name: 'Nguyễn Văn B' },
          approved_by: { full_name: 'Quản lý Dịch vụ' },
        });

        const result = await warrantyService.approveGoodwillClaim(2, 2, {
          supportType: 'PERCENTAGE' as any,
          supportPct: 50,
          approvalNote: 'Hỗ trợ 50% tiền phụ tùng do lỗi hao mòn sớm',
        });

        expect(result.status).toBe('APPROVED');
        expect(result.support_type).toBe('PERCENTAGE');
        expect(result.support_pct).toBe(50);
      });
    });

    describe('rejectGoodwillClaim', () => {
      it('báo lỗi ngoại lệ khi để trống lý do từ chối (UC-86 Luồng ngoại lệ)', async () => {
        await expect(
          warrantyService.rejectGoodwillClaim(1, 2, {
            approvalNote: '',
          })
        ).rejects.toThrow('Vui lòng nhập lý do giải trình phê duyệt/từ chối');
      });

      it('từ chối thành công, cập nhật trạng thái REJECTED và gửi thông báo giải thích cho khách (UC-86 Bước 6b)', async () => {
        prismaMock.goodwillClaim.findUnique.mockResolvedValue({
          id: 3,
          status: 'PENDING',
          created_by_id: 10,
        });

        prismaMock.goodwillClaim.update.mockResolvedValue({
          id: 3,
          status: 'REJECTED',
          approval_note: 'Xe đã quá hạn hơn 90 ngày và hơn 5.000 km, không đủ điều kiện hỗ trợ thiện chí',
          approved_by_id: 2,
          vehicle: { license_plate: '51F-12345' },
          customer: { full_name: 'Lê Văn C' },
          approved_by: { full_name: 'Quản lý Dịch vụ' },
        });

        const result = await warrantyService.rejectGoodwillClaim(3, 2, {
          approvalNote: 'Xe đã quá hạn hơn 90 ngày và hơn 5.000 km, không đủ điều kiện hỗ trợ thiện chí',
        });

        expect(result.status).toBe('REJECTED');
        expect(prismaMock.goodwillClaim.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 3 },
            data: expect.objectContaining({
              status: 'REJECTED',
              approved_by_id: 2,
            }),
          })
        );
        expect(prismaMock.notification.create).toHaveBeenCalled();
      });
    });
  });
});

