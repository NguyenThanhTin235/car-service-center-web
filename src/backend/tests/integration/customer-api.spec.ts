import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

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

vi.mock('../../src/utils/prisma', () => ({
  default: prismaMock,
}));

import app from '../../src/app';

describe('Customer API Integration Tests (/api/customers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
  });

  it('GET /api/customers returns paginated customer list and handles DB failure with 500', async () => {
    prismaMock.user.count.mockResolvedValueOnce(1);
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 1,
        full_name: 'Nguyen Van Hung',
        phone: '0901234567',
        email: 'hung@example.com',
        address: 'HCM',
        is_active: true,
        vehicles: [
          {
            id: 10,
            license_plate: '51F-123.45',
            make: 'Toyota',
            model: 'Camry',
            color: 'Đen',
            vehicle_size: 'MEDIUM',
          },
        ],
      },
    ]);

    const res = await request(app).get('/api/customers?search=51F&page=1&limit=10&status=active');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].fullName).toBe('Nguyen Van Hung');
    expect(res.body.pagination).toMatchObject({ totalRecords: 1, currentPage: 1, limit: 10 });

    prismaMock.user.count.mockRejectedValueOnce(new Error('DB connection lost'));
    const errRes = await request(app).get('/api/customers');
    expect(errRes.status).toBe(500);
    expect(errRes.body.status).toBe('error');
  });

  it('POST /api/customers creates customer + vehicle (201) and returns 400 on duplicate phone', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 2,
      full_name: 'Tran Thi Mai',
      phone: '0987654321',
      email: '0987654321@placeholder.com',
    });
    prismaMock.vehicle.findUnique.mockResolvedValueOnce(null);

    const createRes = await request(app).post('/api/customers').send({
      fullName: 'Tran Thi Mai',
      phone: '0987654321',
      vehicles: [
        {
          licensePlate: '51G-222.33',
          make: 'Honda',
          model: 'CR-V',
          vehicleSize: 'MEDIUM',
        },
      ],
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('success');
    expect(createRes.body.data.id).toBe(2);

    prismaMock.user.findFirst.mockResolvedValueOnce({ id: 2, phone: '0987654321' });
    const dupRes = await request(app).post('/api/customers').send({
      fullName: 'Duplicate',
      phone: '0987654321',
    });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.status).toBe('error');
    expect(dupRes.body.message).toBe('Số điện thoại đã tồn tại trong hệ thống.');
  });

  it('PUT /api/customers/:id updates customer info (200) and returns 400 when not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 2,
      phone: '0987654321',
      email: 'mai@example.com',
    });
    prismaMock.user.update.mockResolvedValueOnce({
      id: 2,
      full_name: 'Tran Thi Mai Updated',
      phone: '0987654321',
    });

    const updateRes = await request(app).put('/api/customers/2').send({
      fullName: 'Tran Thi Mai Updated',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('success');
    expect(updateRes.body.data.full_name).toBe('Tran Thi Mai Updated');

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const notFoundRes = await request(app).put('/api/customers/999').send({ fullName: 'X' });
    expect(notFoundRes.status).toBe(400);
    expect(notFoundRes.body.status).toBe('error');
    expect(notFoundRes.body.message).toBe('Không tìm thấy khách hàng.');
  });

  it('DELETE /api/customers/:id, PATCH /restore, and DELETE /hard enforce guardrails and succeed cleanly', async () => {
    // Blocked soft delete due to open WorkOrder
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 5, is_active: true });
    prismaMock.workOrder.findFirst.mockResolvedValueOnce({ wo_number: 'WO-2026-111' });

    const blockedRes = await request(app).delete('/api/customers/5');
    expect(blockedRes.status).toBe(400);
    expect(blockedRes.body.message).toContain('WO-2026-111');

    // Clean soft delete
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 5, is_active: true });
    prismaMock.workOrder.findFirst.mockResolvedValueOnce(null);
    prismaMock.invoice.findFirst.mockResolvedValueOnce(null);
    prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.update.mockResolvedValueOnce({ id: 5, is_active: false });

    const deleteRes = await request(app).delete('/api/customers/5');
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.status).toBe('success');

    // Restore
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 5, is_active: false });
    prismaMock.user.update.mockResolvedValueOnce({ id: 5, is_active: true });

    const restoreRes = await request(app).patch('/api/customers/5/restore');
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.status).toBe('success');

    // Hard delete
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 5, is_active: false });
    prismaMock.user.delete.mockResolvedValueOnce({ id: 5 });

    const hardRes = await request(app).delete('/api/customers/5/hard');
    expect(hardRes.status).toBe(200);
    expect(hardRes.body.status).toBe('success');
  });

  it('GET /api/customers/:id/service-history returns customer service history (200) and 400 when missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 21 });
    prismaMock.workOrder.findMany.mockResolvedValueOnce([
      {
        id: 700,
        wo_number: 'WO-2026-700',
        status: 'RELEASED',
        order_type: 'STANDARD',
        created_at: new Date('2026-11-11T10:00:00Z'),
        closed_at: null,
        vehicle: { id: 1, license_plate: '30A-986.48', make: 'Ford', model: 'Ranger', year: 2023 },
        advisor: { id: 4, full_name: 'Lễ Tân Lan' },
        check_in: { mileage: 12000 },
        services: [{ id: 10, name: 'Kiểm tra phanh', status: 'COMPLETED' }],
        invoices: [
          { id: 91, invoice_number: 'INV-2026-091', status: 'PAID', total_amount: 1200000, paid_at: new Date('2026-11-11T12:00:00Z') },
        ],
      },
    ]);

    const okRes = await request(app).get('/api/customers/21/service-history');
    expect(okRes.status).toBe(200);
    expect(okRes.body.status).toBe('success');
    expect(okRes.body.data.summary).toEqual({
      totalOrders: 1,
      totalVisits: 1,
      totalSpent: 1200000,
    });
    expect(okRes.body.data.records).toHaveLength(1);
    expect(okRes.body.data.records[0].woNumber).toBe('WO-2026-700');

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const missingRes = await request(app).get('/api/customers/999/service-history');
    expect(missingRes.status).toBe(400);
    expect(missingRes.body.status).toBe('error');
    expect(missingRes.body.message).toBe('Không tìm thấy khách hàng');
  });
});
