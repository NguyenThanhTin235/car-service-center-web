import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobTypeService } from '../../../src/services/job-type.service';
import prisma from '../../../src/utils/prisma';

describe('Unit - JobTypeService (TICKET-ADM-06)', () => {
  const service = new JobTypeService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-JOBT-UT-01: createJobType', () => {
    it('ném lỗi khi tên loại công việc đã tồn tại', async () => {
      const findFirstSpy = vi
        .spyOn(prisma.jobType, 'findFirst')
        .mockResolvedValue({ id: 1, name: 'Thay dầu động cơ' } as any);
      const createSpy = vi.spyOn(prisma.jobType, 'create');

      await expect(
        service.createJobType({ name: 'Thay dầu động cơ', description: 'Bảo dưỡng định kỳ' })
      ).rejects.toThrow('Tên loại công việc đã tồn tại.');

      expect(findFirstSpy).toHaveBeenCalledWith({ where: { name: 'Thay dầu động cơ' } });
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('tạo mới loại công việc thành công khi tên chưa tồn tại', async () => {
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue(null);
      const created = {
        id: 10,
        name: 'Cân chỉnh thước lái',
        description: 'Cân bằng góc đặt bánh xe',
        is_active: true,
      };
      const createSpy = vi.spyOn(prisma.jobType, 'create').mockResolvedValue(created as any);

      const result = await service.createJobType({
        name: 'Cân chỉnh thước lái',
        description: 'Cân bằng góc đặt bánh xe',
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: 'Cân chỉnh thước lái',
          description: 'Cân bằng góc đặt bánh xe',
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('ADM-JOBT-UT-02: updateJobType', () => {
    it('ném lỗi "Không tìm thấy loại công việc." khi ID không tồn tại', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(null);
      const updateSpy = vi.spyOn(prisma.jobType, 'update');

      await expect(service.updateJobType(999, { name: 'Tên mới' })).rejects.toThrow(
        'Không tìm thấy loại công việc.'
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('ném lỗi khi đổi sang tên đã tồn tại ở bản ghi khác', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 2,
        name: 'Kiểm tra phanh',
        description: 'Phanh trước sau',
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue({
        id: 5,
        name: 'Thay dầu động cơ',
      } as any);
      const updateSpy = vi.spyOn(prisma.jobType, 'update');

      await expect(service.updateJobType(2, { name: 'Thay dầu động cơ' })).rejects.toThrow(
        'Tên loại công việc đã tồn tại.'
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('cập nhật thành công khi giữ nguyên tên hoặc đổi sang tên chưa tồn tại', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 2,
        name: 'Kiểm tra phanh',
        description: 'Cũ',
        is_active: true,
      } as any);
      const findFirstSpy = vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue(null);
      const updated = {
        id: 2,
        name: 'Kiểm tra hệ thống phanh ABS',
        description: 'Mới',
        is_active: true,
      };
      const updateSpy = vi.spyOn(prisma.jobType, 'update').mockResolvedValue(updated as any);

      const result = await service.updateJobType(2, {
        name: 'Kiểm tra hệ thống phanh ABS',
        description: 'Mới',
        isActive: true,
      });

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { name: 'Kiểm tra hệ thống phanh ABS' },
      });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          name: 'Kiểm tra hệ thống phanh ABS',
          description: 'Mới',
          is_active: true,
        },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('ADM-JOBT-UT-03: deleteJobType (Business Guard)', () => {
    it('ném lỗi "Không tìm thấy loại công việc." khi ID không tồn tại', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteJobType(404)).rejects.toThrow('Không tìm thấy loại công việc.');
    });

    it('chặn xóa khi totalRefs > 0 (có JobTemplate, Job hoặc JobLabour tham chiếu)', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 3,
        name: 'Sửa chữa điện',
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobTemplate, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.job, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.jobLabour, 'count').mockResolvedValue(3);
      const deleteSpy = vi.spyOn(prisma.jobType, 'delete');

      await expect(service.deleteJobType(3)).rejects.toThrow(
        'Không thể xóa loại công việc "Sửa chữa điện" vì đang được sử dụng bởi: 2 mẫu công việc, 1 công việc thực tế, 3 bản ghi nhân công.'
      );
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('hard-delete thành công khi totalRefs === 0', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 4,
        name: 'Loại công việc nháp',
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobTemplate, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.job, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.jobLabour, 'count').mockResolvedValue(0);
      const deleteSpy = vi.spyOn(prisma.jobType, 'delete').mockResolvedValue({ id: 4 } as any);

      const result = await service.deleteJobType(4);

      expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getJobTypes pagination & search', () => {
    it('lọc theo search và trả về đúng cấu trúc phân trang', async () => {
      vi.spyOn(prisma.jobType, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.jobType, 'findMany').mockResolvedValue([
        { id: 1, name: 'Thay dầu', description: 'Động cơ', is_active: true } as any,
      ]);

      const result = await service.getJobTypes('Thay dầu', 1, 10, false, undefined);

      expect(result.data).toEqual([
        { id: 1, name: 'Thay dầu', description: 'Động cơ', isActive: true },
      ]);
      expect(result.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
    });
  });
});
