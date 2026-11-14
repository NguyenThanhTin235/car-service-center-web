import { describe, it, expect } from 'vitest';

/**
 * Thuật toán tính giá vốn bình quân di động (Moving Weighted Average - MWA)
 * Được áp dụng trực tiếp trong InventoryService.createReceipt (SPEC-INV-01)
 */
function calculateMovingWeightedAverage(
  currentOnHand: number,
  currentAverageCost: number,
  receivedQuantity: number,
  receivedUnitCost: number
): { newOnHand: number; newAverageCost: number } {
  const currentQty = Math.max(0, Math.trunc(currentOnHand));
  const currentCost = Math.max(0, currentAverageCost);
  const recvQty = Math.max(0, Math.trunc(receivedQuantity));
  const recvCost = Math.max(0, receivedUnitCost);

  const newOnHand = currentQty + recvQty;
  let newAverageCost = currentCost;

  if (newOnHand > 0) {
    newAverageCost =
      (currentQty * currentCost + recvQty * recvCost) / newOnHand;
  }

  return {
    newOnHand,
    newAverageCost: Math.round(newAverageCost * 100) / 100,
  };
}

describe('Inventory Costing - Moving Weighted Average (SPEC-INV-01 / UC-52)', () => {
  it('WAC-01: Nhập tồn đầu kỳ hoặc nhập lần đầu (currentOnHand = 0)', () => {
    // Kho chưa có hàng, nhập 10 bugi với giá mua 150,000 đ
    const result = calculateMovingWeightedAverage(0, 0, 10, 150000);

    expect(result.newOnHand).toBe(10);
    expect(result.newAverageCost).toBe(150000);
  });

  it('WAC-02: Nhập bổ sung với giá cao hơn (Lạm phát giá nhập)', () => {
    // Đang có 10 cái giá 100k (tổng vốn = 1,000,000 đ)
    // Nhập thêm 10 cái giá 120k (tổng vốn nhập = 1,200,000 đ)
    // Tổng vốn mới = 2,200,000 đ / 20 cái = 110,000 đ/cái
    const result = calculateMovingWeightedAverage(10, 100000, 10, 120000);

    expect(result.newOnHand).toBe(20);
    expect(result.newAverageCost).toBe(110000);
  });

  it('WAC-03: Nhập bổ sung với giá thấp hơn (Giảm giá từ nhà cung cấp)', () => {
    // Đang có 20 cái giá 110,000 đ (tổng vốn = 2,200,000 đ)
    // Nhập thêm 30 cái giá 90,000 đ (tổng vốn nhập = 2,700,000 đ)
    // Tổng vốn mới = 4,900,000 đ / 50 cái = 98,000 đ/cái
    const result = calculateMovingWeightedAverage(20, 110000, 30, 90000);

    expect(result.newOnHand).toBe(50);
    expect(result.newAverageCost).toBe(98000);
  });

  it('WAC-04: Xử lý số lượng nguyên (Tránh số thập phân cho đơn vị cái/bộ)', () => {
    // Nhập 4.7 cái -> tự động truncate còn 4 cái
    const result = calculateMovingWeightedAverage(5, 50000, 4.7, 60000);

    expect(result.newOnHand).toBe(9); // 5 + 4
    // (5 * 50k + 4 * 60k) / 9 = 490,000 / 9 = 54,444.44 đ
    expect(result.newAverageCost).toBe(54444.44);
  });

  it('WAC-05: Trường hợp nhập số lượng 0 không làm thay đổi giá vốn', () => {
    const result = calculateMovingWeightedAverage(15, 80000, 0, 95000);

    expect(result.newOnHand).toBe(15);
    expect(result.newAverageCost).toBe(80000);
  });
});

