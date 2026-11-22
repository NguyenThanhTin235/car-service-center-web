import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    workOrder: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
    },
    appointment: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    intakeRecord: {
      count: vi.fn(),
    },
    userRole: {
      deleteMany: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  return { prismaMock: mock };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { CustomerService } from '../../../src/services/customer.service';

describe('CustomerService - Desk-Staff Unit Tests', () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    service = new CustomerService();
  });

  describe('STF-CUS-UT-01: Search, Status Filter & Pagination', () => {
    it('filters active/deleted/all customers, searches across name/phone/email/plate, and returns pagination metadata', async () => {
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 5,
          full_name: 'Le Thi Hoa',
          phone: '0909123456',
          email: 'hoa@example.com',
          address: 'Q1, HCM',
          is_active: true,
          vehicles: [
            {
              id: 51,
              license_plate: '51H-888.99',
              make: 'Toyota',
              model: 'Vios',
              color: 'Trắng',
              vehicle_size: 'SMALL',
            },
          ],
          work_orders: [
            {
              id: 301,
              status: 'CLOSED',
              created_at: new Date('2026-11-10T08:00:00Z'),
              services: [{ name: 'Thay dầu động cơ' }],
              invoices: [{ total_amount: 3200000 }],
            },
            {
              id: 300,
              status: 'IN_PROGRESS',
              created_at: new Date('2026-11-01T08:00:00Z'),
              services: [{ name: 'Kiểm tra gầm' }],
              invoices: [],
            },
          ],
        },
      ]);

      const result = await service.getCustomers('51H-888', 1, 10, 'active');

      expect(prismaMock.user.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_active: true,
          OR: [
            { full_name: { contains: '51H-888' } },
            { phone: { contains: '51H-888' } },
            { email: { contains: '51H-888' } },
            { vehicles: { some: { license_plate: { contains: '51H-888' } } } },
          ],
        }),
      });
      expect(result.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
      expect(result.data[0]).toMatchObject({
        id: 5,
        fullName: 'Le Thi Hoa',
        phone: '0909123456',
        isActive: true,
        vehicles: [
          expect.objectContaining({
            id: 51,
            licensePlate: '51H-888.99',
          }),
        ],
        stats: {
          totalVisits: 1,
          totalSpent: 3200000,
          lastVisitDate: new Date('2026-11-10T08:00:00Z'),
          lastService: 'Thay dầu động cơ',
        },
      });
    });

    it('supports deleted status filter without mutating active records', async () => {
      prismaMock.user.count.mockResolvedValue(0);
      prismaMock.user.findMany.mockResolvedValue([]);

      await service.getCustomers(undefined, 2, 5, 'deleted');

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_active: false }),
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('STF-CUS-UT-02: Create & Update Customer with Vehicles', () => {
    it('creates customer with fallback placeholder email when omitted and attaches vehicles', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 12,
        full_name: 'Pham Minh Tuan',
        phone: '0912345678',
        email: '0912345678@placeholder.com',
      });
      prismaMock.vehicle.findUnique.mockResolvedValue(null);

      const created = await service.createCustomer({
        fullName: 'Pham Minh Tuan',
        phone: '0912345678',
        address: 'Thủ Đức',
        vehicles: [
          {
            licensePlate: '51K-123.45',
            make: 'Ford',
            model: 'Ranger',
            year: 2024,
            color: 'Xám',
            vehicleSize: 'LARGE',
          },
        ],
      });

      expect(created.id).toBe(12);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: '0912345678@placeholder.com',
          }),
        })
      );
      expect(prismaMock.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer_id: 12,
            license_plate: '51K-123.45',
            vehicle_size: 'LARGE',
          }),
        })
      );
    });

    it('rejects duplicate phone, email, or license plate during createCustomer', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({ phone: '0912345678', email: 'a@b.com' });
      await expect(
        service.createCustomer({ fullName: 'Test', phone: '0912345678' })
      ).rejects.toThrow('Số điện thoại đã tồn tại trong hệ thống.');

      prismaMock.user.findFirst.mockResolvedValueOnce({ phone: '0900000000', email: 'dup@b.com' });
      await expect(
        service.createCustomer({ fullName: 'Test', phone: '0911111111', email: 'dup@b.com' })
      ).rejects.toThrow('Email đã tồn tại trong hệ thống.');

      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({ id: 13 });
      prismaMock.vehicle.findUnique.mockResolvedValueOnce({ id: 88, license_plate: '51K-999.99' });
      await expect(
        service.createCustomer({
          fullName: 'Test',
          phone: '0911111111',
          vehicles: [
            { licensePlate: '51K-999.99', make: 'Kia', model: 'Seltos', vehicleSize: 'MEDIUM' },
          ],
        })
      ).rejects.toThrow('Biển số xe 51K-999.99 đã tồn tại.');
    });

    it('updateCustomer updates info, removes unlinked vehicle, and blocks deleting vehicle with linked records', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 20,
        phone: '0901112222',
        email: 'old@example.com',
      });
      prismaMock.user.update.mockResolvedValue({ id: 20, full_name: 'Updated Name' });

      prismaMock.vehicle.findMany.mockResolvedValueOnce([{ id: 201 }, { id: 202 }]);
      prismaMock.workOrder.count.mockResolvedValueOnce(1);
      prismaMock.appointment.count.mockResolvedValueOnce(0);
      prismaMock.intakeRecord.count.mockResolvedValueOnce(0);

      await expect(
        service.updateCustomer(20, {
          fullName: 'Updated Name',
          vehicles: [
            { id: 201, licensePlate: '51A-111.11', make: 'Toyota', model: 'Vios', vehicleSize: 'SMALL' },
          ],
        })
      ).rejects.toThrow('Không thể xóa phương tiện vì đã có lịch hẹn hoặc hồ sơ sửa chữa liên kết.');

      prismaMock.vehicle.findMany.mockResolvedValueOnce([{ id: 201 }, { id: 202 }]);
      prismaMock.workOrder.count.mockResolvedValueOnce(0);
      prismaMock.appointment.count.mockResolvedValueOnce(0);
      prismaMock.intakeRecord.count.mockResolvedValueOnce(0);
      prismaMock.vehicle.findUnique.mockResolvedValueOnce(null);

      const updated = await service.updateCustomer(20, {
        fullName: 'Updated Name',
        vehicles: [
          { id: 201, licensePlate: '51A-111.11', make: 'Toyota', model: 'Vios G', vehicleSize: 'SMALL' },
          { licensePlate: '51A-333.33', make: 'VinFast', model: 'VF8', vehicleSize: 'LARGE' },
        ],
      });

      expect(updated.full_name).toBe('Updated Name');
      expect(prismaMock.vehicle.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [202] } } });
      expect(prismaMock.vehicle.update).toHaveBeenCalled();
      expect(prismaMock.vehicle.create).toHaveBeenCalled();
    });
  });

  describe('STF-CUS-UT-03: Soft Delete Guardrails, Restore & Hard Delete', () => {
    it('blocks softDeleteCustomer when active WorkOrder, unpaid Invoice, or open Appointment exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 30, is_active: true });
      prismaMock.workOrder.findFirst.mockResolvedValueOnce({ wo_number: 'WO-2026-001' });

      await expect(service.softDeleteCustomer(30)).rejects.toThrow(
        'Không thể xóa do khách hàng đang có phiếu công việc chưa hoàn thành (Mã: WO-2026-001).'
      );

      prismaMock.workOrder.findFirst.mockResolvedValueOnce(null);
      prismaMock.invoice.findFirst.mockResolvedValueOnce({ invoice_number: 'INV-2026-009' });
      await expect(service.softDeleteCustomer(30)).rejects.toThrow(
        'Không thể xóa do khách hàng đang có hóa đơn chưa thanh toán (Mã: INV-2026-009).'
      );

      prismaMock.workOrder.findFirst.mockResolvedValueOnce(null);
      prismaMock.invoice.findFirst.mockResolvedValueOnce(null);
      prismaMock.appointment.findFirst.mockResolvedValueOnce({ id: 77, status: 'CONFIRMED' });
      await expect(service.softDeleteCustomer(30)).rejects.toThrow(
        'Không thể xóa do khách hàng đang có lịch hẹn chưa xử lý.'
      );
    });

    it('soft-deletes clean customer and restores inactive customer', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 31, is_active: true });
      prismaMock.workOrder.findFirst.mockResolvedValueOnce(null);
      prismaMock.invoice.findFirst.mockResolvedValueOnce(null);
      prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.update.mockResolvedValueOnce({ id: 31, is_active: false });

      const softDeleted = await service.softDeleteCustomer(31);
      expect(softDeleted.is_active).toBe(false);

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 31, is_active: false });
      prismaMock.user.update.mockResolvedValueOnce({ id: 31, is_active: true });

      const restored = await service.restoreCustomer(31);
      expect(restored.is_active).toBe(true);
    });

    it('hardDeleteCustomer deletes vehicles, roles, then user, and wraps FK constraint failures', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 40 });
      prismaMock.user.delete.mockResolvedValueOnce({ id: 40 });

      await service.hardDeleteCustomer(40);
      expect(prismaMock.vehicle.deleteMany).toHaveBeenCalledWith({ where: { customer_id: 40 } });
      expect(prismaMock.userRole.deleteMany).toHaveBeenCalledWith({ where: { user_id: 40 } });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 40 } });

      prismaMock.$transaction.mockRejectedValueOnce(new Error('Foreign key constraint failed'));
      await expect(service.hardDeleteCustomer(40)).rejects.toThrow(
        'Không thể xóa vĩnh viễn khách hàng vì có dữ liệu liên quan (hóa đơn, lịch hẹn...).'
      );
    });
  });

  describe('STF-CUS-UT-04: getCustomerServiceHistory', () => {
    it('returns mapped work orders and aggregated summary in a single query', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 21 });
      prismaMock.workOrder.findMany.mockResolvedValueOnce([
        {
          id: 501,
          wo_number: 'WO-2026-011',
          status: 'CLOSED',
          order_type: 'STANDARD',
          created_at: new Date('2026-11-10T08:00:00Z'),
          closed_at: new Date('2026-11-10T16:00:00Z'),
          vehicle: { id: 10, license_plate: '30A-986.48', make: 'Ford', model: 'Ranger', year: 2023 },
          advisor: { id: 4, full_name: 'Lễ Tân Lan' },
          check_in: { mileage: 45200 },
          services: [
            { id: 1, name: 'Bảo dưỡng 40.000 km', status: 'COMPLETED' },
            { id: 2, name: 'Thay dầu động cơ', status: 'COMPLETED' },
          ],
          invoices: [
            { id: 88, invoice_number: 'INV-2026-088', status: 'PAID', total_amount: 4500000, paid_at: new Date('2026-11-10T16:00:00Z') },
          ],
        },
        {
          id: 500,
          wo_number: 'WO-2026-005',
          status: 'IN_PROGRESS',
          order_type: 'WARRANTY',
          created_at: new Date('2026-11-12T09:00:00Z'),
          closed_at: null,
          vehicle: { id: 11, license_plate: '61A-281.63', make: 'Honda', model: 'Accord', year: 2022 },
          advisor: null,
          check_in: null,
          services: [],
          invoices: [],
        },
      ]);

      const result = await service.getCustomerServiceHistory(21);

      expect(prismaMock.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customer_id: 21 },
          orderBy: { created_at: 'desc' },
        })
      );
      expect(result.summary).toEqual({
        totalOrders: 2,
        totalVisits: 1,
        totalSpent: 4500000,
      });
      expect(result.records[0]).toMatchObject({
        woNumber: 'WO-2026-011',
        status: 'CLOSED',
        mileage: 45200,
        vehicle: { licensePlate: '30A-986.48', make: 'Ford', model: 'Ranger' },
        advisor: { fullName: 'Lễ Tân Lan' },
        invoice: { invoiceNumber: 'INV-2026-088', status: 'PAID', totalAmount: 4500000 },
      });
      expect(result.records[1]).toMatchObject({
        woNumber: 'WO-2026-005',
        orderType: 'WARRANTY',
        mileage: null,
        invoice: null,
      });
    });

    it('throws error when customer is not found or id is invalid', async () => {
      await expect(service.getCustomerServiceHistory(NaN)).rejects.toThrow('ID khách hàng không hợp lệ');

      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.getCustomerServiceHistory(999)).rejects.toThrow('Không tìm thấy khách hàng');
    });
  });
});
