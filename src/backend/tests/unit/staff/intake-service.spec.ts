import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    intakeRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    intakeService: {
      createMany: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  return { prismaMock: mock };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import { IntakeService } from '../../../src/services/intake.service';

describe('IntakeService - Desk-Staff Unit Tests', () => {
  let service: IntakeService;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    service = new IntakeService();
  });

  describe('STF-INT-UT-01: Walk-in & Appointment Intake Creation + Queue Reads', () => {
    it('creates a WALK_IN intake record for an existing customer and vehicle and binds selected services', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Nguyen Van A' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51G-999.88' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);
      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 301,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WALK_IN',
        status: 'QUEUED',
      });

      const created = await service.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'WALK_IN',
          arrivedAt: '2026-12-01T08:30:00.000Z',
          notes: 'Khách ghé kiểm tra điều hòa',
          serviceIds: [2, 4],
        },
        99
      );

      expect(created.id).toBe(301);
      expect(created.status).toBe('QUEUED');
      expect(prismaMock.intakeRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer_id: 10,
            vehicle_id: 20,
            intake_type: 'WALK_IN',
            status: 'QUEUED',
            tow_company: null,
            created_by_id: 99,
          }),
        })
      );
      expect(prismaMock.intakeService.createMany).toHaveBeenCalledWith({
        data: [
          { intake_id: 301, service_id: 2 },
          { intake_id: 301, service_id: 4 },
        ],
      });
    });

    it('queries paginated queue filters and retrieves intake details by id', async () => {
      prismaMock.intakeRecord.count.mockResolvedValue(1);
      prismaMock.intakeRecord.findMany.mockResolvedValue([{ id: 301, status: 'QUEUED' }]);

      const queue = await service.getIntakeQueue({
        status: 'QUEUED',
        intakeType: 'WALK_IN',
        search: '51G',
        page: 1,
        limit: 10,
      });

      expect(queue.data).toHaveLength(1);
      expect(queue.pagination.total).toBe(1);
      expect(queue.pagination.perPage).toBe(10);
      expect(prismaMock.intakeRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );

      prismaMock.intakeRecord.findUnique.mockResolvedValue({ id: 301, status: 'QUEUED' });
      const detail = await service.getIntakeById(301);
      expect(detail.id).toBe(301);

      prismaMock.intakeRecord.findUnique.mockResolvedValue(null);
      await expect(service.getIntakeById(999)).rejects.toThrow('Không tìm thấy phiếu tiếp nhận.');
    });
  });

  describe('STF-INT-UT-02: Quick-Create Customer/Vehicle & Validation Guards', () => {
    it('quick-creates a new customer and vehicle in the same transaction when IDs are omitted', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 501,
        full_name: 'Khach Moi',
        phone: '0988777666',
        email: '0988777666@placeholder.com',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 501,
        full_name: 'Khach Moi',
        phone: '0988777666',
      });
      prismaMock.vehicle.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 601,
          customer_id: 501,
          license_plate: '30A-555.66',
        });
      prismaMock.vehicle.create.mockResolvedValue({
        id: 601,
        customer_id: 501,
        license_plate: '30A-555.66',
      });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);
      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 701,
        customer_id: 501,
        vehicle_id: 601,
        intake_type: 'WALK_IN',
        status: 'QUEUED',
      });

      const created = await service.createIntake(
        {
          customerId: 0,
          vehicleId: 0,
          intakeType: 'WALK_IN',
          arrivedAt: '2026-12-01T09:00:00.000Z',
          newCustomer: {
            fullName: 'Khach Moi',
            phone: '0988777666',
          },
          newVehicle: {
            licensePlate: '30A-555.66',
            make: 'Hyundai',
            model: 'Tucson',
          },
        },
        99
      );

      expect(created.id).toBe(701);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '0988777666',
            email: '0988777666@placeholder.com',
          }),
        })
      );
      expect(prismaMock.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer_id: 501,
            license_plate: '30A-555.66',
            vehicle_size: 'MEDIUM',
          }),
        })
      );
    });

    it('rejects duplicate phone, duplicate plate, mismatched vehicle owner, and duplicate QUEUED intake', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 88, phone: '0901112222' });
      await expect(
        service.createIntake(
          {
            customerId: 0,
            vehicleId: 0,
            intakeType: 'WALK_IN',
            arrivedAt: '2026-12-01T09:00:00.000Z',
            newCustomer: { fullName: 'Dup', phone: '0901112222' },
          },
          99
        )
      ).rejects.toThrow('Số điện thoại 0901112222 đã tồn tại trong hệ thống.');

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValueOnce({ id: 20, license_plate: '51G-111.11' });
      await expect(
        service.createIntake(
          {
            customerId: 10,
            vehicleId: 0,
            intakeType: 'WALK_IN',
            arrivedAt: '2026-12-01T09:00:00.000Z',
            newVehicle: { licensePlate: '51G-111.11', make: 'Kia', model: 'K3' },
          },
          99
        )
      ).rejects.toThrow('Biển số xe 51G-111.11 đã tồn tại.');

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValueOnce({ id: 20, customer_id: 999 });
      await expect(
        service.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WALK_IN',
            arrivedAt: '2026-12-01T09:00:00.000Z',
          },
          99
        )
      ).rejects.toThrow('Phương tiện không thuộc về khách hàng này.');

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValueOnce({ id: 20, customer_id: 10 });
      prismaMock.intakeRecord.findFirst.mockResolvedValueOnce({ id: 333, status: 'QUEUED' });
      await expect(
        service.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WALK_IN',
            arrivedAt: '2026-12-01T09:00:00.000Z',
          },
          99
        )
      ).rejects.toThrow('Xe này đang trong hàng đợi tiếp nhận. Không thể tạo phiếu trùng.');
    });
  });

  describe('STF-INT-UT-03: Tow-In Constraint & Cancel Guards', () => {
    it('requires towCompany for TOW_IN intake before opening transaction', async () => {
      await expect(
        service.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'TOW_IN',
            arrivedAt: '2026-12-01T10:00:00.000Z',
          },
          99
        )
      ).rejects.toThrow('Vui lòng nhập tên người/đơn vị bàn giao xe khi tiếp nhận Tow-in.');

      expect(prismaMock.$transaction).not.toHaveBeenCalled();

      prismaMock.user.findUnique.mockResolvedValue({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10 });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);
      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 401,
        intake_type: 'TOW_IN',
        tow_company: 'Cứu hộ Sài Gòn 115',
        status: 'QUEUED',
      });

      const towCreated = await service.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'TOW_IN',
          arrivedAt: '2026-12-01T10:00:00.000Z',
          towCompany: 'Cứu hộ Sài Gòn 115',
        },
        99
      );
      expect(towCreated.tow_company).toBe('Cứu hộ Sài Gòn 115');
    });

    it('cancels QUEUED intake and rejects cancelling CONVERTED/CANCELLED records', async () => {
      prismaMock.intakeRecord.findUnique.mockResolvedValueOnce({ id: 500, status: 'CONVERTED' });
      await expect(service.cancelIntake(500)).rejects.toThrow(
        'Chỉ có thể hủy phiếu đang ở trạng thái QUEUED. Trạng thái hiện tại: CONVERTED'
      );

      prismaMock.intakeRecord.findUnique.mockResolvedValueOnce({ id: 501, status: 'QUEUED' });
      prismaMock.intakeRecord.update.mockResolvedValue({ id: 501, status: 'CANCELLED' });

      const cancelled = await service.cancelIntake(501);
      expect(cancelled.status).toBe('CANCELLED');
      expect(prismaMock.intakeRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 501 },
          data: { status: 'CANCELLED' },
        })
      );
    });
  });
});
