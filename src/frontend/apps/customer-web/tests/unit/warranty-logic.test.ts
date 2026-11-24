import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type WarrantyStatus = 'VALID' | 'EXPIRED';

interface WarrantyItemShape {
  id: number;
  type: 'SERVICE' | 'PART';
  name: string;
  woNumber: string;
  warrantyMonths: number;
  expirationDate: string | null;
  daysRemaining: number | null;
  status: WarrantyStatus;
  overdueDays: number;
}

function getWarrantyCompositeKey(item: Pick<WarrantyItemShape, 'type' | 'id'>): string {
  return `${item.type}-${item.id}`;
}

function deriveWarrantyStatusByMonths(completedDate: Date, warrantyMonths: number, now: Date): WarrantyStatus {
  if (warrantyMonths <= 0) return 'EXPIRED';
  const exp = new Date(completedDate);
  exp.setMonth(exp.getMonth() + warrantyMonths);
  return exp.getTime() >= now.getTime() ? 'VALID' : 'EXPIRED';
}

function filterWarrantyItems(
  items: WarrantyItemShape[],
  filter: 'ALL' | WarrantyStatus | 'SERVICE' | 'PART'
): WarrantyItemShape[] {
  if (filter === 'ALL') return items;
  if (filter === 'VALID' || filter === 'EXPIRED') {
    return items.filter((item) => item.status === filter);
  }
  return items.filter((item) => item.type === filter);
}

function summarizeWarrantyItems(items: WarrantyItemShape[]) {
  return {
    totalItems: items.length,
    validItems: items.filter((i) => i.status === 'VALID').length,
    expiredItems: items.filter((i) => i.status === 'EXPIRED').length,
  };
}

function formatExpirationDateSafe(expirationDate: string | null): string {
  if (!expirationDate) return 'Không giới hạn';
  const d = new Date(expirationDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

describe('Warranty Logic — Unit Tests (Months-Only, 2 Statuses: VALID / EXPIRED)', () => {
  it('getWarrantyCompositeKey generates unique keys even when numeric IDs overlap across SERVICE and PART', () => {
    const serviceKey = getWarrantyCompositeKey({ type: 'SERVICE', id: 12 });
    const partKey = getWarrantyCompositeKey({ type: 'PART', id: 12 });

    assert.equal(serviceKey, 'SERVICE-12');
    assert.equal(partKey, 'PART-12');
    assert.notEqual(serviceKey, partKey);
  });

  it('deriveWarrantyStatusByMonths returns strictly VALID or EXPIRED based on months', () => {
    const completed = new Date('2026-06-01T00:00:00.000Z');
    const withinSixMonths = new Date('2026-10-15T00:00:00.000Z');
    const afterSixMonths = new Date('2026-12-05T00:00:00.000Z');

    assert.equal(deriveWarrantyStatusByMonths(completed, 6, withinSixMonths), 'VALID');
    assert.equal(deriveWarrantyStatusByMonths(completed, 6, afterSixMonths), 'EXPIRED');
    assert.equal(deriveWarrantyStatusByMonths(completed, 0, withinSixMonths), 'EXPIRED');
  });

  it('filterWarrantyItems & summarizeWarrantyItems keep counts consistent across tabs', () => {
    const items: WarrantyItemShape[] = [
      {
        id: 1,
        type: 'SERVICE',
        name: 'Thay dầu động cơ',
        woNumber: 'WO-001',
        warrantyMonths: 6,
        expirationDate: '2027-01-01T00:00:00.000Z',
        daysRemaining: 120,
        status: 'VALID',
        overdueDays: 0,
      },
      {
        id: 1,
        type: 'PART',
        name: 'Lọc dầu chính hãng',
        woNumber: 'WO-001',
        warrantyMonths: 12,
        expirationDate: '2027-06-01T00:00:00.000Z',
        daysRemaining: 200,
        status: 'VALID',
        overdueDays: 0,
      },
      {
        id: 2,
        type: 'PART',
        name: 'Má phanh trước',
        woNumber: 'WO-002',
        warrantyMonths: 6,
        expirationDate: null,
        daysRemaining: 0,
        status: 'EXPIRED',
        overdueDays: 45,
      },
    ];

    const summary = summarizeWarrantyItems(items);
    assert.equal(summary.totalItems, 3);
    assert.equal(summary.validItems, 2);
    assert.equal(summary.expiredItems, 1);

    assert.equal(filterWarrantyItems(items, 'ALL').length, 3);
    assert.equal(filterWarrantyItems(items, 'VALID').length, 2);
    assert.equal(filterWarrantyItems(items, 'EXPIRED').length, 1);
    assert.equal(filterWarrantyItems(items, 'SERVICE').length, 1);
    assert.equal(filterWarrantyItems(items, 'PART').length, 2);
  });

  it('formatExpirationDateSafe handles null and invalid dates safely', () => {
    assert.equal(formatExpirationDateSafe(null), 'Không giới hạn');
    assert.equal(formatExpirationDateSafe('not-a-date'), '—');
    assert.ok(formatExpirationDateSafe('2027-06-15T00:00:00.000Z').length > 0);
  });
});
