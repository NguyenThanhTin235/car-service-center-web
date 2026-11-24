import { describe, it, expect, vi, beforeEach } from 'vitest';

const cacheStore = new Map<string, string>();
const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: string) => {
    cacheStore.set(key, val);
  }),
}));

const prismaMock = vi.hoisted(() => ({
  serviceCategory: { findMany: vi.fn() },
  user: { findUnique: vi.fn() },
  vehicle: { findMany: vi.fn() },
  appointment: { findMany: vi.fn() },
  workOrder: { findMany: vi.fn() },
}));

vi.mock('../../src/utils/redis.util', () => cacheMock);
vi.mock('../../src/utils/prisma', () => ({ default: prismaMock }));

import {
  AiCustomerContextBuilder,
  CATALOG_CACHE_KEY,
  CATALOG_CACHE_TTL_SECONDS,
  computeQuotationSummary,
} from '../../src/services/ai-chat/ai-customer-context.builder';

describe('AiCustomerContextBuilder', () => {
  let builder: AiCustomerContextBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
    builder = new AiCustomerContextBuilder();
  });

  describe('getCatalogContext', () => {
    it('queries Prisma once on cache miss and hits cache on subsequent calls within 5 minutes', async () => {
      prismaMock.serviceCategory.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Bảo dưỡng định kỳ',
          description: 'Bảo dưỡng theo km',
          services: [
            {
              id: 1,
              name: 'Bảo dưỡng 40.000 km',
              description: 'Kiểm tra 48 hạng mục',
              pricing_type: 'VEHICLE_SIZE',
              fixed_price: null,
              warranty_months: 6,
              warranty_mileage: 5000,
              size_prices: [
                { vehicle_size: 'SMALL', price: 2500000 },
                { vehicle_size: 'LARGE', price: 3200000 },
              ],
            },
            {
              id: 2,
              name: 'Thay dầu động cơ 5W-30',
              description: 'Dầu tổng hợp',
              pricing_type: 'FIXED',
              fixed_price: 950000,
              warranty_months: 0,
              warranty_mileage: 0,
              size_prices: [],
            },
            {
              id: 5,
              name: 'Đại tu gầm & hệ thống treo',
              description: 'Khảo sát thực tế',
              pricing_type: 'LABOUR_PARTS',
              fixed_price: null,
              warranty_months: 12,
              warranty_mileage: 10000,
              size_prices: [],
            },
          ],
        },
      ]);

      const first = await builder.getCatalogContext();
      const second = await builder.getCatalogContext();

      expect(prismaMock.serviceCategory.findMany).toHaveBeenCalledTimes(1);
      expect(cacheMock.setCache).toHaveBeenCalledWith(
        CATALOG_CACHE_KEY,
        expect.any(String),
        CATALOG_CACHE_TTL_SECONDS
      );
      expect(first).toEqual(second);
      expect(first.garageInfo.vatPolicy).toContain('0% VAT');
      expect(first.garageInfo.bookingSlots.morning).toContain('08:00');
      expect(first.garageInfo.bookingSlots.afternoon).toContain('16:00');
      expect(first.categories[0].services.map((s) => s.pricingType)).toEqual([
        'VEHICLE_SIZE',
        'FIXED',
        'LABOUR_PARTS',
      ]);
    });
  });

  describe('computeQuotationSummary', () => {
    it('sums APPROVED and SENT quotations and strictly excludes REJECTED and DRAFT', () => {
      const summary = computeQuotationSummary([
        { id: 10, status: 'APPROVED', grand_total: 1800000 },
        { id: 11, status: 'REJECTED', grand_total: 1200000 },
        { id: 12, status: 'SENT', grand_total: 950000 },
        { id: 13, status: 'DRAFT', grand_total: 5000000 },
      ]);

      expect(summary).toEqual({
        totalApprovedAmount: 1800000,
        pendingApprovalAmount: 950000,
        projectedCombinedTotal: 2750000,
        pendingQuotationIds: [12],
      });
    });
  });

  describe('getCustomerPrivateContext', () => {
    it('scopes strictly to authenticatedUserId, computes quotationSummary, and derives dual warranty', async () => {
      const futureRecentReleaseDate = new Date();
      futureRecentReleaseDate.setDate(futureRecentReleaseDate.getDate() - 3);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 88,
        full_name: 'Chị Lan',
        phone: '0909888777',
        email: 'lan@example.com',
      });
      prismaMock.vehicle.findMany.mockResolvedValue([
        {
          id: 201,
          license_plate: '51H-123.45',
          make: 'Mazda',
          model: 'CX-5',
          year: 2022,
          vehicle_size: 'SUV',
        },
      ]);
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.workOrder.findMany
        // Call 1: activeWorkOrders
        .mockResolvedValueOnce([
          {
            id: 500,
            wo_number: 'WO-2026-500',
            status: 'IN_PROGRESS',
            order_type: 'NORMAL',
            vehicle: { id: 201, license_plate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
            advisor: { full_name: 'Trần Cố Vấn', phone: '090111222' },
            check_in: { mileage: 42000, complaint: 'Kêu gầm', status: 'CONFIRMED' },
            services: [
              { id: 1, name: 'Kiểm tra gầm', status: 'IN_PROGRESS', pricing_type: 'LABOUR_PARTS', qc_records: [] },
            ],
            inspections: [
              {
                findings: [
                  {
                    id: 71,
                    description: 'Rô-tuyn cân bằng rơ lỏng',
                    severity: 'HIGH',
                    recommendation: 'Thay thế cặp rô-tuyn',
                    part_name: 'Rô-tuyn trước',
                    status: 'NEW',
                  },
                ],
              },
            ],
            quotations: [
              { id: 1, quotation_number: 'QT-1', quotation_type: 'PRIMARY', status: 'APPROVED', grand_total: 1800000, lines: [] },
              { id: 2, quotation_number: 'QT-2', quotation_type: 'SUPPLEMENTARY', status: 'REJECTED', grand_total: 1200000, lines: [] },
              { id: 3, quotation_number: 'QT-3', quotation_type: 'SUPPLEMENTARY', status: 'SENT', grand_total: 950000, lines: [] },
            ],
            invoices: [
              { id: 90, invoice_number: 'INV-90', status: 'ISSUED', total_amount: 1800000, amount_due: 1800000 },
            ],
          },
        ])
        // Call 2: recentCompletedOrders
        .mockResolvedValueOnce([
          {
            id: 400,
            wo_number: 'WO-2026-400',
            status: 'RELEASED',
            updated_at: futureRecentReleaseDate,
            closed_at: null,
            vehicle: { id: 201, license_plate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
            check_in: { mileage: 40000 },
            release: { released_at: futureRecentReleaseDate, release_notes: 'OK' },
            services: [
              {
                name: 'Cân bằng động bánh xe',
                service: { id: 6, name: 'Cân bằng động bánh xe', warranty_months: 6, warranty_mileage: 5000 },
                jobs: [
                  {
                    parts: [
                      {
                        item: {
                          warranty_months: 12,
                          warranty_mileage: 10000,
                          part_category: { name: 'Má phanh trước' },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
            invoices: [],
          },
        ]);

      const ctx = await builder.getCustomerPrivateContext(88);

      expect(ctx).not.toBeNull();
      // Verify strict customer_id scoping and visibility filters
      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customer_id: 88, status: 'ACTIVE' },
        })
      );
      expect(prismaMock.workOrder.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { customer_id: 88, status: { notIn: ['CLOSED', 'CANCELLED', 'RELEASED'] } },
          include: expect.objectContaining({
            inspections: { include: { findings: expect.objectContaining({ where: { is_visible_to_customer: true } }) } },
            quotations: expect.objectContaining({ where: { status: { in: ['SENT', 'APPROVED', 'REJECTED'] } } }),
            invoices: expect.objectContaining({ where: { status: { in: ['ISSUED', 'PAID'] } } }),
          }),
        })
      );

      // Verify quotationSummary on activeWorkOrders[0]
      expect(ctx!.activeWorkOrders[0].quotationSummary).toEqual({
        totalApprovedAmount: 1800000,
        pendingApprovalAmount: 950000,
        projectedCombinedTotal: 2750000,
        pendingQuotationIds: [3],
      });

      // Verify recentCompletedOrders and dual warranty derivation
      expect(ctx!.recentCompletedOrders).toHaveLength(1);
      expect(ctx!.warrantyRecords).toHaveLength(2);
      expect(ctx!.warrantyRecords[0]).toMatchObject({
        itemType: 'SERVICE',
        warrantyMonths: 6,
        mileageAtService: 40000,
        status: 'ACTIVE',
      });
      expect(ctx!.warrantyRecords[1]).toMatchObject({
        itemType: 'PART',
        itemName: 'Má phanh trước',
        warrantyMonths: 12,
        mileageAtService: 40000,
        status: 'ACTIVE',
      });
    });
  });
});
