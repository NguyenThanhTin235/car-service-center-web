import { describe, it, expect, vi } from 'vitest';
import { EmployeeService } from '../../../src/services/employee.service';

describe('Employee Deactivation & Work Constraints Guardrail (SPEC-EMP-DEACTIVATE)', () => {
  it('EMP-DEACT-01: Chặn vô hiệu hóa nếu Kỹ thuật viên đang có công việc chưa hoàn thành', async () => {
    const service = new EmployeeService();

    // Mock checkEmployeeActiveWorkConstraints to simulate finding unfinished active jobs
    const mockCheck = vi.spyOn(service, 'checkEmployeeActiveWorkConstraints').mockImplementation(async (empId) => {
      if (empId === 10) {
        throw new Error(
          'Không thể ngừng hoạt động nhân sự vì nhân viên đang được phân công 2 công việc chưa hoàn thành: "Căn chỉnh thước lái" (WO-202611-001). Vui lòng hoàn tất hoặc điều phối lại công việc cho nhân sự khác trước khi vô hiệu hóa.'
        );
      }
    });

    await expect(service.checkEmployeeActiveWorkConstraints(10, null)).rejects.toThrow(
      'đang được phân công 2 công việc chưa hoàn thành'
    );

    mockCheck.mockRestore();
  });

  it('EMP-DEACT-02: Cho phép vô hiệu hóa nếu nhân viên không có ràng buộc công việc nào', async () => {
    const service = new EmployeeService();

    const mockCheck = vi.spyOn(service, 'checkEmployeeActiveWorkConstraints').mockImplementation(async () => {
      // No active jobs -> passes without error
    });

    await expect(service.checkEmployeeActiveWorkConstraints(20, null)).resolves.not.toThrow();

    mockCheck.mockRestore();
  });

  it('EMP-DEACT-03: Chặn vô hiệu hóa nếu Cố vấn dịch vụ đang phụ trách Lệnh sửa chữa chưa đóng', async () => {
    const service = new EmployeeService();

    const mockCheck = vi.spyOn(service, 'checkEmployeeActiveWorkConstraints').mockImplementation(async (_empId, userId) => {
      if (userId === 99) {
        throw new Error(
          'Không thể ngừng hoạt động nhân sự vì Cố vấn đang trực tiếp phụ trách 1 lệnh sửa chữa chưa đóng (WO-202611-008). Vui lòng bàn giao lệnh sửa chữa trước khi vô hiệu hóa.'
        );
      }
    });

    await expect(service.checkEmployeeActiveWorkConstraints(5, 99)).rejects.toThrow(
      'đang trực tiếp phụ trách 1 lệnh sửa chữa chưa đóng'
    );

    mockCheck.mockRestore();
  });

  it('EMP-DISPATCH-04: Lọc kỹ thuật viên cho danh sách điều phối loại bỏ các KTV ngừng hoạt động', () => {
    const allEmployees = [
      { id: 1, fullName: 'Nguyễn Văn A', position: 'TECHNICIAN', isActive: true },
      { id: 2, fullName: 'Trần Văn B', position: 'TECHNICIAN', isActive: false }, // Đã ngừng hoạt động
      { id: 3, fullName: 'Lê Văn C', position: 'MANAGER', isActive: true },
      { id: 4, fullName: 'Phạm Văn D', position: 'TECHNICIAN', isActive: true },
    ];

    const dispatchableTechnicians = allEmployees.filter(
      (e) => Boolean(e.isActive) && e.position === 'TECHNICIAN'
    );

    expect(dispatchableTechnicians).toHaveLength(2);
    expect(dispatchableTechnicians.map((t) => t.id)).toEqual([1, 4]);
    expect(dispatchableTechnicians.some((t) => t.id === 2)).toBe(false);
  });
});
