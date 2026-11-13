import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceService } from '../../../src/services/service.service';
import prisma from '../../../src/utils/prisma';

describe('UC-61: Toggle Active Service & Filter Inactive from Cố vấn / Khách hàng', () => {
  const service = new ServiceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TOGGLE-01: Tắt dịch vụ chuyển sang isActive = false (Ngừng cung cấp)', async () => {
    const mockService = {
      id: 20,
      name: 'Rửa xe bọt tuyết',
      is_active: true,
    };

    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockService as any);
    const updateSpy = vi.spyOn(prisma.service, 'update').mockResolvedValue({
      ...mockService,
      is_active: false,
    } as any);

    const result = await service.toggleService(20);

    expect(prisma.service.findUnique).toHaveBeenCalledWith({ where: { id: 20 } });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { is_active: false },
    });
    expect(result.isActive).toBe(false);
  });

  it('TOGGLE-02: Bật lại dịch vụ chuyển sang isActive = true (Hoạt động bình thường)', async () => {
    const mockService = {
      id: 20,
      name: 'Rửa xe bọt tuyết',
      is_active: false,
    };

    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockService as any);
    const updateSpy = vi.spyOn(prisma.service, 'update').mockResolvedValue({
      ...mockService,
      is_active: true,
    } as any);

    const result = await service.toggleService(20);

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { is_active: true },
    });
    expect(result.isActive).toBe(true);
  });

  it('FILTER-01: getServices lọc isActive=true khi Cố vấn và Khách hàng yêu cầu dịch vụ đang mở', async () => {
    const countSpy = vi.spyOn(prisma.service, 'count').mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.service, 'findMany').mockResolvedValue([
      {
        id: 1,
        name: 'Thay dầu nhớt',
        description: '',
        pricing_type: 'FIXED',
        fixed_price: 250000,
        is_active: true,
        category: { id: 1, name: 'Bảo dưỡng' },
        size_prices: [],
        created_at: new Date(),
      } as any,
    ]);

    const result = await service.getServices(undefined, undefined, 1, 10, false, true);

    expect(countSpy).toHaveBeenCalledWith({
      where: { is_active: true },
    });
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_active: true },
      })
    );
    expect(result.data.length).toBe(1);
    expect(result.data[0].isActive).toBe(true);
  });
});
