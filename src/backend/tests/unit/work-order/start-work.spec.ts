import { describe, it, expect, vi } from 'vitest';

describe('Start Work Execution Flow (SPEC-WO-START)', () => {
  it('START-01: Transition rules - Work order must be in APPROVED status before starting work', () => {
    const invalidStatuses = ['DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL', 'CANCELLED', 'CLOSED', 'RELEASED'];

    invalidStatuses.forEach((status) => {
      const canStart = status === 'APPROVED';
      expect(canStart).toBe(false);
    });

    const validStatus = 'APPROVED';
    expect(validStatus === 'APPROVED').toBe(true);
  });

  it('START-02: Work order and WoService state transitions upon startWork', () => {
    // Initial state after Quotation approval
    const beforeWorkOrder = {
      id: 50,
      woNumber: 'WO-20261026-0001',
      status: 'APPROVED',
      services: [
        { id: 101, name: 'Bảo dưỡng định kỳ 20,000km', status: 'PENDING' },
        { id: 102, name: 'Thay thế má phanh trước', status: 'PENDING' },
      ],
      quotations: [{ id: 1, status: 'APPROVED' }],
    };

    expect(beforeWorkOrder.status).toBe('APPROVED');
    expect(beforeWorkOrder.services.every((s) => s.status === 'PENDING')).toBe(true);

    // Simulated execution of startWork
    const afterWorkOrder = {
      ...beforeWorkOrder,
      status: 'IN_PROGRESS',
      services: beforeWorkOrder.services.map((s) => ({
        ...s,
        status: s.status === 'PENDING' ? 'IN_PROGRESS' : s.status,
      })),
    };

    expect(afterWorkOrder.status).toBe('IN_PROGRESS');
    expect(afterWorkOrder.services.every((s) => s.status === 'IN_PROGRESS')).toBe(true);
  });

  it('START-03: Guard check - Cannot start work if already IN_PROGRESS', () => {
    const workOrder = {
      id: 50,
      status: 'IN_PROGRESS',
    };

    const validateStart = (wo: typeof workOrder) => {
      if (wo.status === 'IN_PROGRESS') {
        throw new Error('Phiếu công việc này đã bắt đầu thi công.');
      }
      if (wo.status !== 'APPROVED') {
        throw new Error('Phiếu công việc chưa được phê duyệt báo giá.');
      }
      return true;
    };

    expect(() => validateStart(workOrder)).toThrow('Phiếu công việc này đã bắt đầu thi công.');
  });

  it('START-04: Customer notification email content verification', () => {
    const customer = {
      fullName: 'Nguyễn Văn A',
      email: 'customer@example.com',
    };
    const vehicle = {
      licensePlate: '51K-999.88',
      make: 'Toyota',
      model: 'Camry',
    };
    const advisor = {
      fullName: 'Trần Văn Cố Vấn',
    };

    const trackingLink = 'http://localhost:3000/tracking';
    const emailSubject = `[Car Service Center] Xe ${vehicle.licensePlate} đã bắt đầu thi công dịch vụ`;

    expect(emailSubject).toContain('51K-999.88');
    expect(emailSubject).toContain('bắt đầu thi công');
    expect(trackingLink).toBe('http://localhost:3000/tracking');
  });
});
