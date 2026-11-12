import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobTypeService } from '../../src/services/job-type.service';
import prisma from '../../src/utils/prisma';

describe('UC-65: Toggle JobType & Filter Inactive From Selection', () => {
  const service = new JobTypeService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TOGGLE-JT-01: Tạm ngưng hoạt động loại công việc chuyển sang is_active = false', async () => {
    const mockJobType = {
      id: 3,
      name: 'Chẩn đoán điện động cơ',
      description: 'Quét lỗi bằng máy chẩn đoán',
      is_active: true,
    };

    vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(mockJobType as any);
    const updateSpy = vi.spyOn(prisma.jobType, 'update').mockResolvedValue({
      ...mockJobType,
      is_active: false,
    } as any);

    const result = await service.toggleJobType(3);

    expect(prisma.jobType.findUnique).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { is_active: false },
    });
    expect(result.isActive).toBe(false);
  });

  it('TOGGLE-JT-02: Kích hoạt lại loại công việc chuyển sang is_active = true', async () => {
    const mockJobType = {
      id: 3,
      name: 'Chẩn đoán điện động cơ',
      description: 'Quét lỗi bằng máy chẩn đoán',
      is_active: false,
    };

    vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(mockJobType as any);
    const updateSpy = vi.spyOn(prisma.jobType, 'update').mockResolvedValue({
      ...mockJobType,
      is_active: true,
    } as any);

    const result = await service.toggleJobType(3);

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { is_active: true },
    });
    expect(result.isActive).toBe(true);
  });

  it('FILTER-JT-01: Lọc loại công việc với isActive = true khi thêm công việc vào phiếu dịch vụ', async () => {
    const countSpy = vi.spyOn(prisma.jobType, 'count').mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.jobType, 'findMany').mockResolvedValue([
      {
        id: 1,
        name: 'Bảo dưỡng nhanh',
        description: '',
        is_active: true,
      } as any,
    ]);

    const result = await service.getJobTypes(undefined, 1, 10, false, true);

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
