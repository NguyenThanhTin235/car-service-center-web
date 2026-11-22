import { describe, it, expect } from 'vitest';

function formatVND(value: number, compact = false): string {
  if (isNaN(value)) return '0 ₫';

  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      const billions = (value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '');
      return `${billions} tỷ ₫`;
    }
    if (Math.abs(value) >= 1_000_000) {
      const millions = (value / 1_000_000).toFixed(1).replace(/\.?0+$/, '');
      return `${millions} tr ₫`;
    }
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  const rounded = (Math.round((value + Number.EPSILON) * 10) / 10).toFixed(1);
  const sign = value > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

describe('Unit Test - Dashboard Formatters & Numeric Taste Discipline', () => {
  it('FMT-01: Định dạng tiền tệ đầy đủ theo chuẩn vi-VN', () => {
    const res = formatVND(1500000);
    expect(res).toContain('1.500.000');
    expect(res).toContain('₫');
  });

  it('FMT-02: Định dạng rút gọn tiền triệu (tr ₫) cho thẻ KPI', () => {
    expect(formatVND(185400000, true)).toBe('185.4 tr ₫');
    expect(formatVND(20000000, true)).toBe('20 tr ₫');
  });

  it('FMT-03: Định dạng rút gọn tiền tỷ (tỷ ₫) cho doanh thu quý/năm', () => {
    expect(formatVND(1500000000, true)).toBe('1.5 tỷ ₫');
    expect(formatVND(2000000000, true)).toBe('2 tỷ ₫');
  });

  it('FMT-04: Định dạng phần trăm tăng trưởng (+ / -)', () => {
    expect(formatPercent(12.45)).toBe('+12.5%');
    expect(formatPercent(-8.32)).toBe('-8.3%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('FMT-05: Xử lý an toàn khi đầu vào là NaN', () => {
    expect(formatVND(NaN)).toBe('0 ₫');
    expect(formatPercent(NaN)).toBe('0%');
  });
});
