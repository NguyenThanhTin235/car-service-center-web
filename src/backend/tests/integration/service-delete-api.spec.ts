import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - Delete Service Endpoint (DELETE /api/services/:id)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trường hợp 1: Chặn xóa vĩnh viễn dịch vụ đã từng được sử dụng trong phiếu sửa chữa của khách hàng', () => {
    it('Trả về từ chối xóa vĩnh viễn và giải thích đồng thời chuyển trạng thái sang Ngừng cung cấp', async () => {
      const mockExisting = {
        id: 5,
        name: 'Bảo dưỡng định kỳ 10.000 km',
        is_active: true,
        _count: {
          wo_services: 1,
          appt_services: 0,
          intake_services: 0,
        },
      };

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockExisting as any);
      vi.spyOn(prisma.service, 'update').mockResolvedValue({
        id: 5,
        is_active: false,
      } as any);

      const response = await request(app).delete('/api/services/5');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(false);
      expect(response.body.isDeactivated).toBe(true);
      expect(response.body.message).toBe(
        'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.'
      );
    });
  });

  describe('Trường hợp 2: Xóa vĩnh viễn dịch vụ vừa tạo nhầm chưa từng phát sinh bất kỳ giao dịch nào', () => {
    it('Xóa hoàn toàn và thông báo "Đã xóa dịch vụ thành công"', async () => {
      const mockExisting = {
        id: 88,
        name: 'Dịch vụ tạo nhầm',
        is_active: true,
        _count: {
          wo_services: 0,
          appt_services: 0,
          intake_services: 0,
        },
      };

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockExisting as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          vehicleSizePrice: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          jobTemplate: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
          inspectionTemplate: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
          service: { delete: vi.fn().mockResolvedValue({ id: 88 }) },
        };
        return callback(txMock);
      });

      const response = await request(app).delete('/api/services/88');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(true);
      expect(response.body.isDeactivated).toBe(false);
      expect(response.body.message).toBe('Đã xóa dịch vụ thành công');
      expect(response.body.data).toEqual({ id: 88 });
    });
  });

  describe('Trường hợp không tìm thấy dịch vụ', () => {
    it('Trả về mã 404 khi không tìm thấy id', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      const response = await request(app).delete('/api/services/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Không tìm thấy danh mục dịch vụ.');
    });
  });
});
