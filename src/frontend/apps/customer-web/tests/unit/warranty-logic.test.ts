import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type WarrantyStatus = 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED';

interface WarrantyItemShape {
  id: number;
  type: 'SERVICE' | 'PART';
  name: string;
  woNumber: string;
  completedOdo: number | null;
  expirationDate: string | null;
  expirationMileage: number | null;
  daysRemaining: number | null;
  kmRemaining: number | null;
  status: WarrantyStatus;
  overdueDays: number;
  overdueKm: number;
}

function getWarrantyCompositeKey(item: Pick<WarrantyItemShape, 'type' | 'id'>): string {
  return `${item.type}-${item.id}`;
}

function deriveGoodwillEligibility(overdueDays: number, overdueKm: number): WarrantyStatus {
  if (overdueDays <= 0 && overdueKm <= 0) return 'VALID';
  if (overdueDays <= 30 && overdueKm <= 1000) return 'OVERDUE_LIGHT';
  return 'EXPIRED';
}

function filterWarrantyItems(
  items: WarrantyItemShape[],
  filter: 'ALL' | WarrantyStatus
): WarrantyItemShape[] {
  if (filter === 'ALL') return items;
  return items.filter((item) => item.status === filter);
}

function summarizeWarrantyItems(items: WarrantyItemShape[]) {
  return {
    totalItems: items.length,
    validItems: items.filter((i) => i.status === 'VALID').length,
    overdueLightItems: items.filter((i) => i.status === 'OVERDUE_LIGHT').length,
    expiredItems: items.filter((i) => i.status === 'EXPIRED').length,
  };
}

function formatExpirationLabel(item: Pick<WarrantyItemShape, 'expirationDate' | 'expirationMileage'>): {
  dateLabel: string;
  mileageLabel: string;
} {
  return {
    dateLabel: item.expirationDate
      ? new Date(item.expirationDate).toLocaleDateString('vi-VN')
      : 'Không giới hạn thời gian',
    mileageLabel:
      item.expirationMileage !== null && item.expirationMileage !== undefined
        ? `${item.expirationMileage.toLocaleString('vi-VN')} km`
        : 'Không giới hạn km',
  };
}

describe('Warranty Logic — Unit Tests (UC-81..UC-87)', () => {
  it('getWarrantyCompositeKey generates unique keys even when numeric IDs overlap across SERVICE and PART', () => {
    const serviceKey = getWarrantyCompositeKey({ type: 'SERVICE', id: 12 });
    const partKey = getWarrantyCompositeKey({ type: 'PART', id: 12 });

    assert.equal(serviceKey, 'SERVICE-12');
    assert.equal(partKey, 'PART-12');
    assert.notEqual(serviceKey, partKey);
  });

  it('deriveGoodwillEligibility enforces strict AND semantics (overdueDays <= 30 && overdueKm <= 1000)', () => {
    assert.equal(deriveGoodwillEligibility(0, 0), 'VALID');
    assert.equal(deriveGoodwillEligibility(15, 500), 'OVERDUE_LIGHT');
    assert.equal(deriveGoodwillEligibility(30, 1000), 'OVERDUE_LIGHT');
    // 35 days + 500 km must be EXPIRED, NOT OVERDUE_LIGHT
    assert.equal(deriveGoodwillEligibility(35, 500), 'EXPIRED');
    // 10 days + 1200 km must be EXPIRED, NOT OVERDUE_LIGHT
    assert.equal(deriveGoodwillEligibility(10, 1200), 'EXPIRED');
  });

  it('filterWarrantyItems & summarizeWarrantyItems keep counts consistent across tabs', () => {
    const items: WarrantyItemShape[] = [
      {
        id: 1,
        type: 'SERVICE',
        name: 'Thay dầu động cơ',
        woNumber: 'WO-001',
        completedOdo: 10000,
        expirationDate: '2027-01-01T00:00:00.000Z',
        expirationMileage: 20000,
        daysRemaining: 120,
        kmRemaining: 5000,
        status: 'VALID',
        overdueDays: 0,
        overdueKm: 0,
      },
      {
        id: 1,
        type: 'PART',
        name: 'Lọc dầu chính hãng',
        woNumber: 'WO-001',
        completedOdo: 10000,
        expirationDate: '2026-10-01T00:00:00.000Z',
        expirationMileage: 15000,
        daysRemaining: 0,
        kmRemaining: 0,
        status: 'OVERDUE_LIGHT',
        overdueDays: 10,
        overdueKm: 200,
      },
      {
        id: 2,
        type: 'PART',
        name: 'Má phanh trước',
        woNumber: 'WO-002',
        completedOdo: null,
        expirationDate: null,
        expirationMileage: null,
        daysRemaining: 0,
        kmRemaining: 0,
        status: 'EXPIRED',
        overdueDays: 45,
        overdueKm: 1500,
      },
    ];

    const summary = summarizeWarrantyItems(items);
    assert.equal(summary.totalItems, 3);
    assert.equal(summary.validItems, 1);
    assert.equal(summary.overdueLightItems, 1);
    assert.equal(summary.expiredItems, 1);

    assert.equal(filterWarrantyItems(items, 'ALL').length, 3);
    assert.equal(filterWarrantyItems(items, 'VALID').length, 1);
    assert.equal(filterWarrantyItems(items, 'OVERDUE_LIGHT').length, 1);
    assert.equal(filterWarrantyItems(items, 'EXPIRED').length, 1);
  });

  it('formatExpirationLabel safely handles nullable expirationDate and expirationMileage without throwing', () => {
    const nullLabels = formatExpirationLabel({
      expirationDate: null,
      expirationMileage: null,
    });
    assert.equal(nullLabels.dateLabel, 'Không giới hạn thời gian');
    assert.equal(nullLabels.mileageLabel, 'Không giới hạn km');

    const validLabels = formatExpirationLabel({
      expirationDate: '2027-06-15T00:00:00.000Z',
      expirationMileage: 50000,
    });
    assert.ok(validLabels.dateLabel.length > 0);
    assert.ok(validLabels.mileageLabel.includes('50'));
    assert.ok(validLabels.mileageLabel.endsWith('km'));
  });
});
