import { describe, it, expect } from 'vitest';
import { AiCustomerValidatorService } from '../../src/services/ai-chat/ai-customer-validator.service';
import { buildTemporalContextVn } from '../../src/services/ai-chat/ai-customer-prompt.builder';
import { GARAGE_STATIC_INFO } from '../../src/services/ai-chat/ai-customer-context.builder';
import { CatalogContext, CustomerPrivateContext } from '../../src/services/ai-chat/ai-customer-chat.types';

const MOCK_CATALOG: CatalogContext = {
  garageInfo: GARAGE_STATIC_INFO,
  categories: [
    {
      id: 1,
      name: 'Bảo dưỡng định kỳ',
      description: 'Gói bảo dưỡng định kỳ',
      services: [
        {
          id: 10,
          name: 'Thay dầu nhớt động cơ',
          categoryName: 'Bảo dưỡng định kỳ',
          description: 'Thay dầu và lọc nhớt',
          pricingType: 'VEHICLE_SIZE',
          fixedPrice: null,
          sizePrices: [
            { vehicleSize: 'SMALL', price: 900000 },
            { vehicleSize: 'MEDIUM', price: 1200000 },
            { vehicleSize: 'SUV', price: 1500000 },
          ],
          warrantyMonths: 3,
        },
        {
          id: 11,
          name: 'Kiểm tra hệ thống phanh',
          categoryName: 'Bảo dưỡng định kỳ',
          description: 'Kiểm tra má phanh, đĩa phanh',
          pricingType: 'FIXED',
          fixedPrice: 450000,
          sizePrices: [],
          warrantyMonths: 3,
        },
      ],
    },
  ],
};

function getNextWeekdayDateStr(targetDow?: number): string {
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const cursor = new Date(Date.now() + vnOffsetMs + 24 * 60 * 60 * 1000);
  for (let i = 0; i < 14; i++) {
    const dow = cursor.getUTCDay();
    if (targetDow !== undefined ? dow === targetDow : dow !== 0) {
      const y = cursor.getUTCFullYear();
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cursor.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return '2026-12-01';
}

function makeCustomerContext(overrides?: Partial<CustomerPrivateContext>): CustomerPrivateContext {
  return {
    customer: { id: 1, fullName: 'Nguyễn Văn A' },
    vehicles: [
      {
        id: 101,
        licensePlate: '51A-12345',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vehicleSize: 'MEDIUM',
      },
    ],
    upcomingAppointments: [],
    activeWorkOrders: [],
    recentCompletedOrders: [],
    warrantyRecords: [],
    ...overrides,
  };
}

describe('AI Chatbot In-Chat Booking Guardrails & Validation', () => {
  const validator = new AiCustomerValidatorService();

  it('builds 14-day VN temporal context and flags Sundays as closed', () => {
    const ctxText = buildTemporalContextVn(new Date('2026-11-27T13:00:00.000Z'));
    expect(ctxText).toContain('2026-11-27');
    expect(ctxText).toContain('NGHỈ CHỦ NHẬT, KHÔNG NHẬN LỊCH');
  });

  it('keeps CONFIRM_BOOKING and enriches vehicleLabel, serviceNames, estimatedTotal when valid', () => {
    const futureWorkday = getNextWeekdayDateStr();
    const customerCtx = makeCustomerContext();

    const res = validator.validateAndSanitize(
      {
        reply: 'Em đã chuẩn bị thông tin lịch hẹn cho xe 51A-12345.',
        intent: 'BOOKING_REQUEST',
        suggested_questions: [],
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận đặt lịch',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              preselectedServiceIds: [10, 11],
              preferredDate: futureWorkday,
              preferredTime: '09:30',
              notes: 'Thay dầu định kỳ',
              isWarranty: false,
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: customerCtx }
    );

    expect(res.actions).toHaveLength(1);
    expect(res.actions[0].type).toBe('CONFIRM_BOOKING');
    expect(res.actions[0].target).toBe('action:confirm-booking');
    expect(res.actions[0].payload).toMatchObject({
      preselectedVehicleId: 101,
      preselectedServiceIds: [10, 11],
      preferredDate: futureWorkday,
      preferredTime: '09:30',
      isWarranty: false,
      vehicleLabel: '51A-12345 (Toyota Camry)',
      serviceNames: ['Thay dầu nhớt động cơ', 'Kiểm tra hệ thống phanh'],
      estimatedTotal: 1650000,
    });
  });

  it('auto-fills the only vehicle when preselectedVehicleId is omitted for single-vehicle customer', () => {
    const futureWorkday = getNextWeekdayDateStr();
    const customerCtx = makeCustomerContext();

    const res = validator.validateAndSanitize(
      {
        reply: 'Xác nhận lịch hẹn',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận đặt lịch',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedServiceIds: [11],
              preferredDate: futureWorkday,
              preferredTime: '14:00',
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: customerCtx }
    );

    expect(res.actions[0].type).toBe('CONFIRM_BOOKING');
    expect(res.actions[0].payload?.preselectedVehicleId).toBe(101);
    expect(res.actions[0].payload?.estimatedTotal).toBe(450000);
  });

  it('downgrades CONFIRM_BOOKING to OPEN_BOOKING_MODAL on Sunday, outside hours, past date, or conflicting appointment', () => {
    const nextSunday = getNextWeekdayDateStr(0);
    const futureWorkday = getNextWeekdayDateStr();
    const customerCtx = makeCustomerContext({
      upcomingAppointments: [
        {
          id: 90,
          scheduledDate: futureWorkday,
          scheduledTime: '08:30',
          status: 'CONFIRMED',
          vehicle: { licensePlate: '51A-12345', make: 'Toyota', model: 'Camry' },
          services: ['Kiểm tra hệ thống phanh'],
          notes: null,
        },
      ],
    });

    const interventions: string[] = [];

    // 1. Sunday
    const sundayRes = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch Chủ nhật',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              preselectedServiceIds: [11],
              preferredDate: nextSunday,
              preferredTime: '09:00',
            },
          },
        ],
      },
      'CUSTOMER',
      {
        catalog: MOCK_CATALOG,
        customerContext: customerCtx,
        onIntervention: (r) => interventions.push(r),
      }
    );
    expect(sundayRes.actions[0].type).toBe('OPEN_BOOKING_MODAL');
    expect(sundayRes.actions[0].payload?.preferredDate).toBeUndefined();

    // 2. Outside office hours (18:30)
    const lateRes = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch tối',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              preselectedServiceIds: [11],
              preferredDate: getNextWeekdayDateStr(2),
              preferredTime: '18:30',
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: makeCustomerContext() }
    );
    expect(lateRes.actions[0].type).toBe('OPEN_BOOKING_MODAL');

    // 3. Past date
    const pastRes = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch quá khứ',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              preselectedServiceIds: [11],
              preferredDate: '2020-01-01',
              preferredTime: '09:00',
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: makeCustomerContext() }
    );
    expect(pastRes.actions[0].type).toBe('OPEN_BOOKING_MODAL');

    // 4. Conflicting same-day appointment for the vehicle
    const conflictRes = validator.validateAndSanitize(
      {
        reply: 'Đặt trùng ngày',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              preselectedServiceIds: [11],
              preferredDate: futureWorkday,
              preferredTime: '15:00',
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: customerCtx }
    );
    expect(conflictRes.actions[0].type).toBe('OPEN_BOOKING_MODAL');
    expect(interventions).toContain('confirm_booking_downgraded_to_modal');
  });

  it('blocks warranty booking in chat and redirects to /customer/profile?tab=warranty', () => {
    const futureWorkday = getNextWeekdayDateStr();
    const customerCtx = makeCustomerContext();

    const res = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch bảo hành',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận đặt lịch bảo hành',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 101,
              notes: 'Bảo hành má phanh',
              preferredDate: futureWorkday,
              preferredTime: '09:00',
              isWarranty: true,
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: customerCtx }
    );

    expect(res.actions[0]).toMatchObject({
      type: 'NAVIGATE',
      target: '/customer/profile?tab=warranty',
    });
  });

  it('redirects 0-vehicle customer to /customer/profile?tab=vehicles for booking requests', () => {
    const futureWorkday = getNextWeekdayDateStr();
    const noVehicleCtx = makeCustomerContext({ vehicles: [] });

    const validatorRes = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preferredDate: futureWorkday,
              preferredTime: '09:00',
              notes: 'Thay dầu',
            },
          },
        ],
      },
      'CUSTOMER',
      { catalog: MOCK_CATALOG, customerContext: noVehicleCtx }
    );
    expect(validatorRes.actions[0]).toMatchObject({
      type: 'NAVIGATE',
      target: '/customer/profile?tab=vehicles',
    });

    const fallbackRes = validator.buildDeterministicFallback({
      message: 'Tôi muốn đặt lịch thay dầu sáng mai',
      authMode: 'CUSTOMER',
      catalog: MOCK_CATALOG,
      customerContext: noVehicleCtx,
    });
    expect(fallbackRes.actions[0]).toMatchObject({
      type: 'NAVIGATE',
      target: '/customer/profile?tab=vehicles',
    });
  });

  it('blocks IDOR foreign vehicle ID and downgrades CONFIRM_BOOKING', () => {
    const futureWorkday = getNextWeekdayDateStr();
    const multiVehicleCtx = makeCustomerContext({
      vehicles: [
        { id: 101, licensePlate: '51A-12345', make: 'Toyota', model: 'Camry', year: 2022, vehicleSize: 'MEDIUM' },
        { id: 102, licensePlate: '51B-67890', make: 'Mazda', model: 'CX-5', year: 2023, vehicleSize: 'SUV' },
      ],
    });
    const interventions: string[] = [];

    const res = validator.validateAndSanitize(
      {
        reply: 'Đặt lịch xe lạ',
        intent: 'BOOKING_REQUEST',
        actions: [
          {
            type: 'CONFIRM_BOOKING',
            label: 'Xác nhận',
            icon: 'event_available',
            target: 'action:confirm-booking',
            payload: {
              preselectedVehicleId: 9999,
              preselectedServiceIds: [11],
              preferredDate: futureWorkday,
              preferredTime: '09:00',
            },
          },
        ],
      },
      'CUSTOMER',
      {
        catalog: MOCK_CATALOG,
        customerContext: multiVehicleCtx,
        onIntervention: (r) => interventions.push(r),
      }
    );

    expect(interventions).toContain('foreign_vehicle_id_stripped');
    expect(interventions).toContain('confirm_booking_downgraded_to_modal');
    expect(res.actions[0].type).toBe('OPEN_BOOKING_MODAL');
    expect(res.actions[0].payload?.preselectedVehicleId).toBeUndefined();
  });
});
