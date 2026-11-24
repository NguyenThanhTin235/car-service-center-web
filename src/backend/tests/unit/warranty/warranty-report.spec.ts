import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkOrderType, MovementType } from '@prisma/client';

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    workOrder: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    woService: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    jobPart: {
      findMany: vi.fn(),
    },
    goodsReceiptItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
    },
  };

  return {
    prismaMock: mock,
  };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { reportService } from '../../../src/services/report.service';
import { getWarrantyReport } from '../../../src/controllers/report.controller';

describe('UC-86: Báo cáo Thống kê & Phân tích Quản trị Bảo hành', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Phân quyền truy cập nghiêm ngặt (RBAC)', () => {
    it('Chặn truy cập và ném lỗi khi vai trò không phải Quản lý dịch vụ hoặc Quản trị viên (CUSTOMER, SA, TECHNICIAN, DESK STAFF)', async () => {
      const invalidRolesList = [
        ['CUSTOMER'],
        ['SA'],
        ['TECHNICIAN'],
        ['DESK STAFF'],
        ['STAFF'],
      ];

      for (const roles of invalidRolesList) {
        await expect(
          reportService.getWarrantyReport({}, roles)
        ).rejects.toThrow(
          'Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng của xưởng.'
        );
      }
    });

    it('Cho phép truy cập khi tài khoản là SERVICE_MANAGER, SYSTEM_ADMIN, ADMIN hoặc MANAGER', async () => {
      prismaMock.workOrder.count.mockResolvedValue(0);
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const validRolesList = [
        ['SERVICE_MANAGER'],
        ['SYSTEM_ADMIN'],
        ['ADMIN'],
        ['MANAGER'],
      ];

      for (const roles of validRolesList) {
        const result = await reportService.getWarrantyReport({}, roles);
        expect(result).toBeDefined();
        expect(result.operationalMetrics).toBeDefined();
      }
    });
  });

  describe('2. Kiểm tra tính hợp lệ của khoảng thời gian (Date Range)', () => {
    it('Ném lỗi khi ngày bắt đầu lớn hơn ngày kết thúc (startDate > endDate)', async () => {
      await expect(
        reportService.getWarrantyReport(
          {
            startDate: '2026-11-25',
            endDate: '2026-11-20',
          },
          ['SERVICE_MANAGER']
        )
      ).rejects.toThrow(
        'Khoảng thời gian không hợp lệ. Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'
      );
    });

    it('Tự động thiết lập mặc định theo tháng hiện tại khi không truyền startDate và endDate', async () => {
      prismaMock.workOrder.count.mockResolvedValue(0);
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const result = await reportService.getWarrantyReport({}, ['ADMIN']);
      expect(result.period).toBeDefined();
      expect(new Date(result.period.start).getDate()).toBe(1);
    });
  });

  describe('3. Chỉ số Vận hành (Operational Metrics)', () => {
    it('Tính toán chính xác tổng lượt xe phục vụ, lượt xe bảo hành và tỷ lệ bảo hành (%)', async () => {
      // Giả lập 200 lượt phục vụ toàn xưởng, 10 lượt bảo hành
      prismaMock.workOrder.count
        .mockResolvedValueOnce(200) // totalServedCount
        .mockResolvedValueOnce(10);  // warrantyCasesCount

      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const result = await reportService.getWarrantyReport(
        {
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        },
        ['SERVICE_MANAGER']
      );

      expect(result.operationalMetrics.totalServedCount).toBe(200);
      expect(result.operationalMetrics.warrantyCasesCount).toBe(10);
      expect(result.operationalMetrics.warrantyRate).toBe(5.0); // 10 / 200 * 100 = 5%
    });

    it('Xử lý an toàn trường hợp chưa có lượt xe phục vụ nào (tỷ lệ = 0%)', async () => {
      prismaMock.workOrder.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const result = await reportService.getWarrantyReport({}, ['MANAGER']);
      expect(result.operationalMetrics.totalServedCount).toBe(0);
      expect(result.operationalMetrics.warrantyCasesCount).toBe(0);
      expect(result.operationalMetrics.warrantyRate).toBe(0);
    });
  });

  describe('4. Chi phí Vốn Thiệt hại (MWA Cost) & Thống kê Phụ tùng lỗi', () => {
    it('Tính toán chính xác giá vốn bình quân di động (MWA) từ StockMovement và gom nhóm phụ tùng lỗi', async () => {
      prismaMock.workOrder.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(2);

      // Giả lập 2 phiếu bảo hành có phụ tùng xuất kho
      const mockWarrantyOrders = [
        {
          id: 101,
          wo_number: 'WO-WAR-001',
          order_type: WorkOrderType.WARRANTY,
          created_at: new Date('2026-11-10T08:00:00Z'),
          parent_work_order_id: 1,
          vehicle: { license_plate: '51H-123.45' },
          parent_work_order: {
            id: 1,
            wo_number: 'WO-2026-0001',
            services: [
              {
                jobs: [
                  {
                    labours: [
                      {
                        employee: {
                          id: 10,
                          full_name: 'Nguyễn Văn Kỹ Thuật 1',
                          position: 'Kỹ thuật viên gầm máy',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          services: [
            {
              service: {
                id: 1,
                name: 'Thay lọc gió động cơ',
                category: { id: 100, name: 'Hệ thống nạp khí' },
              },
              jobs: [
                {
                  id: 201,
                  labours: [],
                  parts: [
                    {
                      id: 301,
                      is_warranty: true,
                      item: {
                        id: 501,
                        sku: 'LOC-GIO-DENSO-001',
                        part_category: { name: 'Lọc gió động cơ' },
                        brand: { name: 'Denso' },
                        average_cost: 150000,
                      },
                      movements: [
                        {
                          id: 401,
                          movement_type: MovementType.ISSUE,
                          quantity: 2,
                          unit_cost: 150000, // MWA unit cost: 150,000 * 2 = 300,000
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 102,
          wo_number: 'WO-WAR-002',
          order_type: WorkOrderType.WARRANTY,
          created_at: new Date('2026-11-15T09:00:00Z'),
          parent_work_order_id: 2,
          vehicle: { license_plate: '51K-999.88' },
          parent_work_order: {
            id: 2,
            wo_number: 'WO-2026-0002',
            services: [
              {
                jobs: [
                  {
                    labours: [
                      {
                        employee: {
                          id: 10,
                          full_name: 'Nguyễn Văn Kỹ Thuật 1',
                          position: 'Kỹ thuật viên gầm máy',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          services: [
            {
              service: {
                id: 2,
                name: 'Thay má phanh trước',
                category: { id: 200, name: 'Hệ thống phanh' },
              },
              jobs: [
                {
                  id: 202,
                  labours: [],
                  parts: [
                    {
                      id: 302,
                      is_warranty: true,
                      item: {
                        id: 502,
                        sku: 'MA-PHANH-BREMBO-01',
                        part_category: { name: 'Má phanh' },
                        brand: { name: 'Brembo' },
                        average_cost: 450000,
                      },
                      movements: [
                        {
                          id: 402,
                          movement_type: MovementType.ISSUE,
                          quantity: 1,
                          unit_cost: 450000, // MWA unit cost: 450,000 * 1 = 450,000
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      prismaMock.workOrder.findMany.mockResolvedValue(mockWarrantyOrders);

      // Giả lập tìm nhà cung cấp gần nhất từ phiếu nhập hàng
      prismaMock.goodsReceiptItem.findMany.mockResolvedValue([
        {
          item_id: 501,
          receipt: {
            supplier: {
              id: 88,
              name: 'Công ty TNHH Phụ Tùng Denso Việt Nam',
              phone: '02838123456',
              email: 'contact@denso.vn',
              contact_person: 'Trần Văn Đại diện',
            },
          },
        },
        {
          item_id: 502,
          receipt: {
            supplier: {
              id: 99,
              name: 'Nhà phân phối Brembo Sài Gòn',
              phone: '0909123456',
              email: 'sales@brembo.vn',
              contact_person: 'Lê Thị Hỗ Trợ',
            },
          },
        },
      ]);

      const result = await reportService.getWarrantyReport(
        {
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        },
        ['SERVICE_MANAGER']
      );

      // Kiểm tra tổng chi phí vốn MWA: 300,000 + 450,000 = 750,000
      expect(result.costMetrics.totalWarrantyMwaCost).toBe(750000);
      expect(result.costMetrics.totalPartsQuantity).toBe(3);

      // Kiểm tra danh sách phụ tùng lỗi
      expect(result.topFaultyParts).toHaveLength(2);
      const topPart = result.topFaultyParts[0];
      expect(topPart.sku).toBe('LOC-GIO-DENSO-001');
      expect(topPart.faultyCount).toBe(2);
      expect(topPart.defectRate).toBe(66.67); // 2 / 3 * 100 = 66.67%
      expect(topPart.supplier.supplierName).toBe('Công ty TNHH Phụ Tùng Denso Việt Nam');
      expect(topPart.supplier.supplierPhone).toBe('02838123456');

      const secondPart = result.topFaultyParts[1];
      expect(secondPart.sku).toBe('MA-PHANH-BREMBO-01');
      expect(secondPart.faultyCount).toBe(1);
      expect(secondPart.defectRate).toBe(33.33); // 1 / 3 * 100 = 33.33%
      expect(secondPart.supplier.supplierName).toBe('Nhà phân phối Brembo Sài Gòn');
    });

    it('Fallback tính giá vốn MWA khi phụ tùng chưa có StockMovement', async () => {
      prismaMock.workOrder.count.mockResolvedValueOnce(10).mockResolvedValueOnce(1);

      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 103,
          wo_number: 'WO-WAR-003',
          order_type: WorkOrderType.WARRANTY,
          created_at: new Date('2026-11-12T08:00:00Z'),
          parent_work_order_id: null,
          vehicle: { license_plate: '51A-111.22' },
          services: [
            {
              service: { category: { id: 300, name: 'Hệ thống dầu' } },
              jobs: [
                {
                  parts: [
                    {
                      id: 303,
                      is_warranty: true,
                      issued_quantity: 4,
                      planned_quantity: 4,
                      item: {
                        id: 503,
                        sku: 'DAU-NHOT-CASTROL',
                        part_category: { name: 'Dầu nhớt' },
                        brand: { name: 'Castrol' },
                        average_cost: 100000,
                      },
                      movements: [], // Không có movement
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      prismaMock.goodsReceiptItem.findMany.mockResolvedValue([]);

      const result = await reportService.getWarrantyReport({}, ['SYSTEM_ADMIN']);

      // 4 * 100,000 = 400,000
      expect(result.costMetrics.totalWarrantyMwaCost).toBe(400000);
      expect(result.costMetrics.totalPartsQuantity).toBe(4);
      expect(result.topFaultyParts[0].supplier.supplierName).toBe('Chưa xác định');
    });
  });

  describe('5. Phân tích lỗi kỹ thuật lặp lại theo Kỹ thuật viên & Nhóm dịch vụ', () => {
    it('Gom nhóm chính xác các vụ bảo hành theo Kỹ thuật viên thi công phiếu gốc', async () => {
      prismaMock.workOrder.count.mockResolvedValue(1);

      const mockWarrantyOrders = [
        {
          id: 110,
          wo_number: 'WO-WAR-110',
          order_type: WorkOrderType.WARRANTY,
          created_at: new Date('2026-11-10T10:00:00Z'),
          parent_work_order_id: 80,
          vehicle: { license_plate: '51F-888.88' },
          parent_work_order: {
            id: 80,
            wo_number: 'WO-2026-0080',
            services: [
              {
                jobs: [
                  {
                    labours: [
                      {
                        employee: {
                          id: 15,
                          full_name: 'Trần Văn Thợ Máy',
                          position: 'Kỹ thuật viên trưởng',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          services: [
            {
              service: {
                id: 5,
                category: { id: 500, name: 'Hệ thống điện lạnh' },
              },
              jobs: [],
            },
          ],
        },
        {
          id: 111,
          wo_number: 'WO-WAR-111',
          order_type: WorkOrderType.WARRANTY,
          created_at: new Date('2026-11-12T11:00:00Z'),
          parent_work_order_id: 81,
          vehicle: { license_plate: '51F-999.99' },
          parent_work_order: {
            id: 81,
            wo_number: 'WO-2026-0081',
            services: [
              {
                jobs: [
                  {
                    labours: [
                      {
                        employee: {
                          id: 15,
                          full_name: 'Trần Văn Thợ Máy',
                          position: 'Kỹ thuật viên trưởng',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          services: [
            {
              service: {
                id: 5,
                category: { id: 500, name: 'Hệ thống điện lạnh' },
              },
              jobs: [],
            },
          ],
        },
      ];

      prismaMock.workOrder.findMany.mockResolvedValue(mockWarrantyOrders);
      prismaMock.goodsReceiptItem.findMany.mockResolvedValue([]);

      const result = await reportService.getWarrantyReport({}, ['ADMIN']);

      // Kiểm tra phân tích theo Kỹ thuật viên
      const techList = result.technicalAnalysis.byTechnician;
      expect(techList).toHaveLength(1);
      expect(techList[0].technicianId).toBe(15);
      expect(techList[0].technicianName).toBe('Trần Văn Thợ Máy');
      expect(techList[0].warrantyCasesCount).toBe(2);
      expect(techList[0].workOrders).toHaveLength(2);
      expect(techList[0].workOrders[0].parentWoNumber).toBe('WO-2026-0080');

      // Kiểm tra phân tích theo Nhóm dịch vụ
      const catList = result.technicalAnalysis.byCategory;
      expect(catList).toHaveLength(1);
      expect(catList[0].categoryId).toBe(500);
      expect(catList[0].categoryName).toBe('Hệ thống điện lạnh');
      expect(catList[0].warrantyCasesCount).toBe(2);
    });
  });

  describe('6. Controller Endpoint GET /api/reports/warranty', () => {
    it('Chặn 403 khi người dùng không có role Quản lý hoặc Quản trị viên', async () => {
      const req: any = {
        user: { id: 10, roles: ['CUSTOMER'] },
        query: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getWarrantyReport(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng của xưởng.',
        })
      );
    });

    it('Trả về 400 khi khoảng thời gian không hợp lệ', async () => {
      const req: any = {
        user: { id: 1, roles: ['SERVICE_MANAGER'] },
        query: {
          startDate: '2026-11-20',
          endDate: '2026-11-10',
        },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getWarrantyReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Khoảng thời gian không hợp lệ'),
        })
      );
    });

    it('Trả về 200 và dữ liệu báo cáo khi thông tin hợp lệ', async () => {
      prismaMock.workOrder.count.mockResolvedValue(0);
      prismaMock.workOrder.findMany.mockResolvedValue([]);

      const req: any = {
        user: { id: 1, roles: ['ADMIN'] },
        query: {
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await getWarrantyReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            operationalMetrics: expect.any(Object),
            costMetrics: expect.any(Object),
            topFaultyParts: expect.any(Array),
            technicalAnalysis: expect.any(Object),
          }),
        })
      );
    });
  });
});
