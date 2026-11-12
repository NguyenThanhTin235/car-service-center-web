import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceService } from '../../src/services/service.service';
import prisma from '../../src/utils/prisma';

describe('UC-61b: Service Deletion & History Guardrails (Xóa dịch vụ)', () => {
  const service = new ServiceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trường hợp 1: Chặn xóa vĩnh viễn dịch vụ đã từng được sử dụng trong phiếu sửa chữa của khách hàng', () => {
    it('DEL-SVC-01: Chặn xóa vĩnh viễn dịch vụ có trong wo_services và chuyển sang trạng thái Ngừng cung cấp', async () => {
      const mockServiceWithWo = {
        id: 10,
        name: 'Thay dầu nhớt máy và lọc dầu',
        is_active: true,
        _count: {
          wo_services: 3,
          appt_services: 0,
          intake_services: 0,
        },
      };

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockServiceWithWo as any);
      const updateSpy = vi.spyOn(prisma.service, 'update').mockResolvedValue({
        id: 10,
        is_active: false,
      } as any);
      const deleteSpy = vi.spyOn(prisma.service, 'delete').mockResolvedValue({} as any);

      const result = await service.deleteService(10);

      expect(prisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        include: {
          _count: {
            select: {
              wo_services: true,
              appt_services: true,
              intake_services: true,
            },
          },
        },
      });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { is_active: false },
      });
      expect(deleteSpy).not.toHaveBeenCalled();

      expect(result.deleted).toBe(false);
      expect(result.isDeactivated).toBe(true);
      expect(result.message).toBe(
        'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.'
      );
    });

    it('DEL-SVC-02: Chặn xóa vĩnh viễn khi dịch vụ có trong lịch hẹn hoặc biên bản tiếp nhận', async () => {
      const mockServiceWithAppt = {
        id: 12,
        name: 'Vệ sinh họng nạp động cơ',
        is_active: true,
        _count: {
          wo_services: 0,
          appt_services: 2,
          intake_services: 1,
        },
      };

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockServiceWithAppt as any);
      const updateSpy = vi.spyOn(prisma.service, 'update').mockResolvedValue({
        id: 12,
        is_active: false,
      } as any);

      const result = await service.deleteService(12);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { is_active: false },
      });
      expect(result.deleted).toBe(false);
      expect(result.isDeactivated).toBe(true);
      expect(result.message).toBe(
        'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.'
      );
    });
  });

  describe('Trường hợp 2: Xóa vĩnh viễn dịch vụ vừa tạo nhầm chưa từng phát sinh bất kỳ giao dịch nào', () => {
    it('DEL-SVC-03: Xóa hoàn toàn dịch vụ khỏi DB khi chưa từng phát sinh giao dịch', async () => {
      const mockServiceNew = {
        id: 99,
        name: 'Dịch vụ tạo thử nghiệm nhầm',
        is_active: true,
        _count: {
          wo_services: 0,
          appt_services: 0,
          intake_services: 0,
        },
      };

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockServiceNew as any);

      const vehicleSizePriceDeleteSpy = vi.fn().mockResolvedValue({ count: 2 });
      const jobTemplateUpdateSpy = vi.fn().mockResolvedValue({ count: 0 });
      const inspectionTemplateUpdateSpy = vi.fn().mockResolvedValue({ count: 0 });
      const serviceDeleteSpy = vi.fn().mockResolvedValue({ id: 99 });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          vehicleSizePrice: { deleteMany: vehicleSizePriceDeleteSpy },
          jobTemplate: { updateMany: jobTemplateUpdateSpy },
          inspectionTemplate: { updateMany: inspectionTemplateUpdateSpy },
          service: { delete: serviceDeleteSpy },
        };
        return callback(txMock);
      });

      const result = await service.deleteService(99);

      expect(vehicleSizePriceDeleteSpy).toHaveBeenCalledWith({
        where: { service_id: 99 },
      });
      expect(jobTemplateUpdateSpy).toHaveBeenCalledWith({
        where: { service_id: 99 },
        data: { service_id: null },
      });
      expect(inspectionTemplateUpdateSpy).toHaveBeenCalledWith({
        where: { service_id: 99 },
        data: { service_id: null },
      });
      expect(serviceDeleteSpy).toHaveBeenCalledWith({
        where: { id: 99 },
      });

      expect(result.deleted).toBe(true);
      expect(result.isDeactivated).toBe(false);
      expect(result.message).toBe('Đã xóa dịch vụ thành công');
      expect(result.data).toEqual({ id: 99 });
    });
  });

  describe('Xử lý lỗi ngoại lệ', () => {
    it('DEL-SVC-04: Báo lỗi khi không tìm thấy id dịch vụ cần xóa', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteService(99999)).rejects.toThrow('Không tìm thấy danh mục dịch vụ.');
    });
  });
});
