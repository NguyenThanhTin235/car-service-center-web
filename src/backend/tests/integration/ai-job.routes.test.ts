import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const cacheStore = new Map<string, string>();
const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: string) => {
    cacheStore.set(key, val);
  }),
  deleteCache: vi.fn(async (key: string) => {
    cacheStore.delete(key);
  }),
  incrRateLimitWindow: vi.fn(async (key: string) => {
    const curr = Number(cacheStore.get(key) || '0') + 1;
    cacheStore.set(key, String(curr));
    return { count: curr, ttlSeconds: 60 };
  }),
}));

const aiClientMock = vi.hoisted(() => ({
  executeWithGeminiFailover: vi.fn(),
  getGeminiClientHealth: vi.fn(() => ({
    configuredKeysCount: 4,
    circuitState: 'CLOSED',
    activeCooldownCount: 0,
  })),
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
}));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  workOrder: { findUnique: vi.fn(), findMany: vi.fn() },
  jobType: { findMany: vi.fn() },
  jobTemplate: { findMany: vi.fn() },
  partCategory: { findMany: vi.fn() },
  jobPart: { findMany: vi.fn() },
  employee: { findMany: vi.fn() },
  service: { findMany: vi.fn() },
  woService: { create: vi.fn() },
  job: { findMany: vi.fn(), create: vi.fn() },
  jobLabour: { create: vi.fn() },
  jobFinding: { upsert: vi.fn() },
  finding: { update: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(async (cb: any) => cb(prismaMock)),
}));

vi.mock('../../src/utils/redis.util', () => cacheMock);
vi.mock('../../src/utils/ai-client.util', () => aiClientMock);
vi.mock('../../src/utils/prisma', () => ({ __esModule: true, default: prismaMock }));

import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt.util';

describe('Integration API — AI Job Planner, Parts, RBAC & API_CONVENTION Envelope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  function mockUserWithRole(id: number, roleName: string) {
    prismaMock.user.findUnique.mockResolvedValue({
      is_active: true,
      roles: [{ role: { name: roleName } }],
    });
    return generateAccessToken({
      id,
      email: `${roleName.toLowerCase()}@autocare.vn`,
      fullName: `User ${roleName}`,
      roles: [roleName],
    });
  }

  it('GET /api/work-orders/ai-metrics enforces ADMIN/MANAGER RBAC and returns standard envelope', async () => {
    const customerToken = mockUserWithRole(10, 'CUSTOMER');
    const custRes = await request(app)
      .get('/api/work-orders/ai-metrics')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(custRes.status).toBe(403);

    const mgrToken = mockUserWithRole(20, 'MANAGER');
    const mgrRes = await request(app)
      .get('/api/work-orders/ai-metrics')
      .set('Authorization', `Bearer ${mgrToken}`);
    expect(mgrRes.status).toBe(200);
    expect(mgrRes.body).toMatchObject({
      success: true,
      code: 200,
      data: {
        llmGateway: { configuredKeysCount: 4, circuitState: 'CLOSED' },
      },
      timestamp: expect.any(String),
    });
  });

  it('POST /api/work-orders/:id/apply-ai-jobs blocks MANAGER (RBAC 403) and enforces standard 409 on CLOSED WO', async () => {
    const mgrToken = mockUserWithRole(20, 'MANAGER');
    const mgrRes = await request(app)
      .post('/api/work-orders/101/apply-ai-jobs')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({ services: [] });
    expect(mgrRes.status).toBe(403);

    const saToken = mockUserWithRole(30, 'SA');
    prismaMock.workOrder.findUnique.mockResolvedValue({
      id: 101,
      wo_number: 'WO-101',
      status: 'CLOSED',
      services: [],
      inspections: [],
    });

    const lockedRes = await request(app)
      .post('/api/work-orders/101/apply-ai-jobs')
      .set('Authorization', `Bearer ${saToken}`)
      .send({
        services: [
          {
            service_name: 'Sửa phanh',
            category_type: 'REPAIR',
            jobs: [{ name: 'Thay má phanh', job_type_id: 1, estimated_hours: 1.0 }],
          },
        ],
      });

    expect(lockedRes.status).toBe(409);
    expect(lockedRes.body).toMatchObject({
      success: false,
      code: 409,
      error: { code: 'WORK_ORDER_LOCKED' },
      timestamp: expect.any(String),
    });
  });

  it('POST /api/work-orders/:id/apply-ai-jobs blocks cross-WorkOrder finding_id IDOR with HTTP 400', async () => {
    const saToken = mockUserWithRole(30, 'SA');
    prismaMock.workOrder.findUnique.mockResolvedValue({
      id: 101,
      wo_number: 'WO-101',
      status: 'IN_PLANNING',
      services: [],
      inspections: [{ findings: [{ id: 55 }] }], // Only finding 55 belongs to WO 101
    });

    const idorRes = await request(app)
      .post('/api/work-orders/101/apply-ai-jobs')
      .set('Authorization', `Bearer ${saToken}`)
      .send({
        services: [
          {
            service_name: 'Khắc phục lỗi',
            category_type: 'REPAIR',
            finding_id: 9999, // Foreign finding ID!
            jobs: [{ name: 'Xử lý phanh', job_type_id: 1, estimated_hours: 1.0 }],
          },
        ],
      });

    expect(idorRes.status).toBe(400);
    expect(idorRes.body).toMatchObject({
      success: false,
      code: 400,
      error: { code: 'INVALID_FINDING_OWNERSHIP' },
      timestamp: expect.any(String),
    });
  });

  it('GET /api/work-orders/:id/ai-job-suggestions returns 404 NOT_FOUND and never returns 500 when Gemini is down', async () => {
    const saToken = mockUserWithRole(30, 'SA');
    prismaMock.workOrder.findUnique.mockResolvedValueOnce(null);

    const notFoundRes = await request(app)
      .get('/api/work-orders/9999/ai-job-suggestions')
      .set('Authorization', `Bearer ${saToken}`);

    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body).toMatchObject({
      success: false,
      code: 404,
      error: { code: 'WORK_ORDER_NOT_FOUND' },
      timestamp: expect.any(String),
    });

    // When WO exists and Gemini fails, deterministic RAG fallback returns HTTP 200 with is_fallback: true
    prismaMock.workOrder.findUnique.mockResolvedValueOnce({
      id: 101,
      wo_number: 'WO-101',
      status: 'IN_PLANNING',
      updated_at: new Date(),
      vehicle: { make: 'Toyota', model: 'Vios', year: 2022, vehicle_size: 'SMALL', license_plate: '51H-111.11' },
      check_in: { mileage: 40000, fuel_level: 'HALF', complaint: 'Kêu phanh trước', exterior_condition: 'Tốt' },
      intake_record: { services: [] },
      inspections: [{ findings: [] }],
      services: [{ id: 1, name: 'Kiểm tra hệ thống phanh', status: 'PENDING', service: null, jobs: [] }],
    });
    prismaMock.jobType.findMany.mockResolvedValue([{ id: 1, name: 'Cơ khí' }]);
    prismaMock.jobTemplate.findMany.mockResolvedValue([
      { id: 1, name: 'Kiểm tra & thay má phanh', estimated_hours: 1.0, price: 200000, job_type_id: 1, service: { name: 'Kiểm tra hệ thống phanh' } },
    ]);
    prismaMock.partCategory.findMany.mockResolvedValue([]);
    prismaMock.workOrder.findMany.mockResolvedValue([]);
    prismaMock.employee.findMany.mockResolvedValue([
      { id: 5, full_name: 'KTV Phanh', skills: [{ skill: { name: 'Phanh' } }], job_labours: [] },
    ]);
    aiClientMock.executeWithGeminiFailover.mockRejectedValueOnce(new Error('503 All keys failed'));

    const fallbackRes = await request(app)
      .get('/api/work-orders/101/ai-job-suggestions')
      .set('Authorization', `Bearer ${saToken}`);

    expect(fallbackRes.status).toBe(200);
    expect(fallbackRes.body).toMatchObject({
      success: true,
      code: 200,
      data: {
        is_fallback: true,
        work_order_id: 101,
      },
      timestamp: expect.any(String),
    });
    expect(fallbackRes.body.data.suggested_services[0].jobs.length).toBeGreaterThan(0);
  });

  it('GET /api/work-orders/:id/jobs/:jobId/ai-part-suggestions blocks pure-labour noise & returns standard envelope', async () => {
    const saToken = mockUserWithRole(30, 'SA');
    prismaMock.workOrder.findUnique.mockResolvedValue({
      id: 101,
      wo_number: 'WO-101',
      vehicle: { make: 'Ford', model: 'Ranger', year: 2023, vehicle_size: 'TRUCK' },
      check_in: { mileage: 25000, complaint: 'Kiểm tra gầm' },
      services: [
        {
          id: 1,
          name: 'Kiểm tra gầm',
          jobs: [
            {
              id: 50,
              name: 'Siết ốc gầm kiểm tra tổng quát',
              description: 'Thuần nhân công',
              job_type: { name: 'Gầm' },
              job_template: null,
              findings: [],
            },
          ],
        },
      ],
    });
    prismaMock.partCategory.findMany.mockResolvedValue([
      {
        id: 10,
        code: 'NUOC-HOA',
        name: 'Nước hoa ô tô',
        description: '',
        uom: { name: 'Hộp' },
        inventory_items: [{ id: 99, sku: 'NH-01', selling_price: 200000, on_hand: 50, is_active: true, brand: { name: 'OEM' } }],
      },
    ]);
    prismaMock.jobPart.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/work-orders/101/jobs/50/ai-part-suggestions')
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      code: 200,
      data: {
        job_id: 50,
        suggestions: [],
      },
      timestamp: expect.any(String),
    });
    expect(aiClientMock.executeWithGeminiFailover).not.toHaveBeenCalled();
  });
});
