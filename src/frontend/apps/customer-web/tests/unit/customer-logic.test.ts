import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPathByRole } from '../../src/utils/roleRedirect.ts';
import {
  getNotificationHref,
  resolveNotificationHref,
  getNotificationTypeLabel,
  getEntityTypeLabel,
  getNotificationIcon,
  formatExactDateTimeVi,
  formatRelativeTimeVi,
} from '../../src/components/notifications/notificationUtils.ts';
import {
  ALL_BOOKING_SLOTS,
  formatVnd,
  isBookingSlotInPast,
  parseComplaintData,
  parseComplaintText,
  parseSafeText,
} from '../../src/utils/customerHelpers.ts';

function makeNotification(overrides: {
  id?: number;
  userId?: number;
  type?: string;
  title?: string;
  message?: string;
  entityType?: string | null;
  entityId?: number | null;
  isRead?: boolean;
  readAt?: string | null;
  createdAt?: string;
}) {
  return {
    id: 1,
    userId: 10,
    type: 'GENERAL',
    title: 'Thông báo test',
    message: 'Nội dung test',
    entityType: null,
    entityId: null,
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Customer Portal Pure Seams — Unit Tests', () => {
  describe('getDashboardPathByRole', () => {
    it('routes CUSTOMER role to /home', () => {
      assert.equal(getDashboardPathByRole(['CUSTOMER']), '/home');
    });

    it('routes internal staff roles to their respective :3001 internal portal paths', () => {
      assert.equal(getDashboardPathByRole(['ADMIN']), 'http://localhost:3001/accounts');
      assert.equal(getDashboardPathByRole(['MANAGER']), 'http://localhost:3001/inventory');
      assert.equal(getDashboardPathByRole(['DESK STAFF']), 'http://localhost:3001/staff/appointments');
      assert.equal(getDashboardPathByRole(['SA']), 'http://localhost:3001/advisor');
    });

    it('falls back safely on empty or unknown roles', () => {
      assert.equal(getDashboardPathByRole([]), '/login');
      assert.equal(getDashboardPathByRole(['UNKNOWN_ROLE']), '/home');
    });
  });

  describe('notificationUtils — routing & labels', () => {
    it('routes appointment notifications to /customer/appointments', () => {
      assert.equal(
        getNotificationHref(makeNotification({ entityType: 'APPOINTMENT', type: 'APPOINTMENT_CONFIRMED' })),
        '/customer/appointments'
      );
      assert.equal(
        resolveNotificationHref(makeNotification({ entityType: null, type: 'APPOINTMENT_REMINDER' })),
        '/customer/appointments'
      );
    });

    it('routes quotation, work order, check-in, QC, and vehicle notifications to tracking tab', () => {
      assert.equal(
        getNotificationHref(makeNotification({ entityType: 'QUOTATION', type: 'QUOTATION_SENT' })),
        '/customer/profile?tab=tracking'
      );
      assert.equal(
        getNotificationHref(makeNotification({ entityType: 'WORK_ORDER', type: 'WORK_ORDER_STARTED' })),
        '/customer/profile?tab=tracking'
      );
      assert.equal(
        getNotificationHref(makeNotification({ entityType: null, type: 'QC_PASSED' })),
        '/customer/profile?tab=tracking'
      );
      assert.equal(
        getNotificationHref(makeNotification({ entityType: null, type: 'VEHICLE_READY' })),
        '/customer/profile?tab=tracking'
      );
    });

    it('routes invoice and payment notifications to invoices tab', () => {
      assert.equal(
        getNotificationHref(makeNotification({ entityType: 'INVOICE', type: 'INVOICE_ISSUED' })),
        '/customer/profile?tab=invoices'
      );
      assert.equal(
        getNotificationHref(makeNotification({ entityType: null, type: 'PAYMENT_SUCCESS' })),
        '/customer/profile?tab=invoices'
      );
    });

    it('falls back to /customer/notifications for general notifications', () => {
      assert.equal(
        getNotificationHref(makeNotification({ entityType: null, type: 'GENERAL' })),
        '/customer/notifications'
      );
    });

    it('maps notification type and entity labels in Vietnamese with safe fallbacks', () => {
      assert.equal(getNotificationTypeLabel('quotation_sent'), 'Báo giá mới');
      assert.equal(getNotificationTypeLabel('PAYMENT_SUCCESS'), 'Thanh toán thành công');
      assert.equal(getNotificationTypeLabel('UNMAPPED_EVENT'), 'Thông báo');

      assert.equal(getEntityTypeLabel('work_order'), 'Phiếu sửa chữa');
      assert.equal(getEntityTypeLabel('INVOICE'), 'Hóa đơn');
      assert.equal(getEntityTypeLabel('CUSTOM_ENTITY'), 'CUSTOM_ENTITY');
    });

    it('selects semantic icons and color classes per notification type', () => {
      assert.equal(getNotificationIcon('APPOINTMENT_CANCELLED').icon, 'event_busy');
      assert.equal(getNotificationIcon('QUOTATION_REJECTED').icon, 'event_busy');
      assert.equal(getNotificationIcon('APPOINTMENT_CONFIRMED').icon, 'calendar_month');
      assert.equal(getNotificationIcon('QUOTATION_SENT').icon, 'request_quote');
      assert.equal(getNotificationIcon('INVOICE_ISSUED').icon, 'receipt_long');
      assert.equal(getNotificationIcon('PAYMENT_SUCCESS').icon, 'receipt_long');
      assert.equal(getNotificationIcon('WORK_ORDER_STARTED').icon, 'build');
    });
  });

  describe('notificationUtils — date formatting', () => {
    it('formats exact Vietnamese datetime as DD/MM/YYYY HH:mm and returns empty string for invalid input', () => {
      const formatted = formatExactDateTimeVi('2026-11-20T08:05:00');
      assert.match(formatted, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      assert.equal(formatted, '20/11/2026 08:05');
      assert.equal(formatExactDateTimeVi('not-a-date'), '');
    });

    it('formats relative Vietnamese durations accurately', () => {
      const now = Date.now();
      assert.equal(formatRelativeTimeVi(new Date(now - 20_000).toISOString()), 'Vừa xong');
      assert.equal(formatRelativeTimeVi(new Date(now - 5 * 60_000).toISOString()), '5 phút trước');
      assert.equal(formatRelativeTimeVi(new Date(now - 3 * 3600_000).toISOString()), '3 giờ trước');
      assert.equal(formatRelativeTimeVi(new Date(now - 2 * 86400_000).toISOString()), '2 ngày trước');
      assert.equal(formatRelativeTimeVi('invalid-date'), '');
    });
  });

  describe('customerHelpers — pure formatters, parsers & booking slots', () => {
    it('parses complaint JSON tags + notes and plain text safely', () => {
      assert.deepEqual(
        parseComplaintData(JSON.stringify({ tags: ['Phanh kêu', ''], notes: 'Kiểm tra gấp' })),
        { tags: ['Phanh kêu'], notes: 'Kiểm tra gấp' }
      );
      assert.deepEqual(parseComplaintData('Xe bị rung nhẹ'), { tags: [], notes: 'Xe bị rung nhẹ' });
      assert.deepEqual(parseComplaintData('{}'), { tags: [], notes: '' });
      assert.deepEqual(parseComplaintData(null), { tags: [], notes: '' });

      assert.equal(
        parseComplaintText(JSON.stringify({ tags: ['Bảo dưỡng', 'Thay nhớt'], notes: '40.000km' })),
        'Bảo dưỡng, Thay nhớt - 40.000km'
      );
      assert.equal(parseComplaintText('{}', 'Mặc định'), 'Mặc định');
    });

    it('extracts safe text from JSON strings, objects, arrays, and plain text', () => {
      assert.equal(parseSafeText('"Không trầy xước"'), 'Không trầy xước');
      assert.equal(parseSafeText(JSON.stringify({ notes: 'Đủ phụ kiện' })), 'Đủ phụ kiện');
      assert.equal(parseSafeText(JSON.stringify(['Camera hành trình', 'Bơm lốp'])), 'Camera hành trình, Bơm lốp');
      assert.equal(parseSafeText('', 'Bàn giao đầy đủ'), 'Bàn giao đầy đủ');
    });

    it('formats VND amounts with safe numeric fallbacks', () => {
      assert.equal(formatVnd(1500000), `${(1500000).toLocaleString('vi-VN')} đ`);
      assert.equal(formatVnd('250000', ' ₫'), `${(250000).toLocaleString('vi-VN')} ₫`);
      assert.equal(formatVnd(null), '0 đ');
      assert.equal(formatVnd('invalid'), '0 đ');
    });

    it('evaluates booking slots deterministically against reference timestamp', () => {
      assert.equal(ALL_BOOKING_SLOTS.length, 11);
      const targetDay = new Date(2026, 10, 22);
      const midMorning = new Date(2026, 10, 22, 9, 15, 0);
      assert.equal(isBookingSlotInPast(targetDay, '08:30', midMorning), true);
      assert.equal(isBookingSlotInPast(targetDay, '09:30', midMorning), false);

      const futureDay = new Date(2026, 10, 23);
      assert.equal(isBookingSlotInPast(futureDay, '08:00', midMorning), false);
    });
  });
});
