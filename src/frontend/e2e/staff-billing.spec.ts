import { test, expect } from '@playwright/test';

const CURRENT_STAFF = {
  id: 4,
  email: 'staff@autocare.vn',
  fullName: 'Lễ Tân Lan',
  roles: ['DESK_STAFF'],
};

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const MOCK_ISSUED_INVOICE = {
  id: 101,
  workOrderId: 501,
  woNumber: 'WO-2026-501',
  invoiceNumber: 'INV-2026-101',
  status: 'ISSUED',
  subtotal: 1500000,
  discountAmount: 0,
  discountReason: null,
  taxAmount: 0,
  totalAmount: 1500000,
  amountDue: 1500000,
  notes: 'Khách thanh toán tại quầy',
  issuedAt: '2026-11-14T08:00:00.000Z',
  createdAt: '2026-11-14T07:50:00.000Z',
  updatedAt: '2026-11-14T08:00:00.000Z',
  customer: { id: 1, fullName: 'Nguyễn Văn Minh', phone: '0908111222', email: 'minh@example.com' },
  vehicle: { id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry', year: 2023, color: 'Đen' },
  advisor: { id: 2, fullName: 'Trần Cố Vấn', phone: '0902000888' },
  createdBy: { id: 4, full_name: 'Lễ Tân Lan', email: 'staff@autocare.vn' },
  issuedBy: { id: 4, full_name: 'Lễ Tân Lan', email: 'staff@autocare.vn' },
  lines: [
    {
      id: 1,
      lineType: 'PACKAGE',
      description: 'Bảo dưỡng định kỳ cấp 20.000 km',
      quantity: 1,
      unitPrice: 1500000,
      amount: 1500000,
      sortOrder: 1,
    },
  ],
  payments: [],
};

test.describe('Desk-Staff Portal E2E: Billing Queue (/staff/billing) & Payment (/staff/billing/[id])', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 5 } },
        }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt-token');
    }, CURRENT_STAFF);
  });

  test('E2E-STF-BIL-01: /staff/billing chuyển tab, Error Retry, Empty state + Xóa tìm kiếm và phân trang', async ({
    page,
  }) => {
    let queueCalls = 0;

    await page.route('**/api/invoices/billing-queue**', async (route) => {
      queueCalls += 1;
      const url = new URL(route.request().url());
      const tab = url.searchParams.get('tab') || 'PENDING';
      const search = url.searchParams.get('search') || '';

      if (queueCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Không thể tải hàng chờ thanh toán' }),
        });
      }

      if (search === 'NO_MATCH_999') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tab,
              summary: {
                pendingCount: 2,
                draftCount: 1,
                issuedCount: 1,
                paidTodayCount: 4,
                paidTodayRevenue: 12500000,
              },
              records: [],
            },
            meta: { pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 5 } },
          }),
        });
      }

      const records =
        tab === 'PENDING'
          ? [
              {
                type: 'WORK_ORDER',
                workOrderId: 501,
                woNumber: 'WO-2026-501',
                estimatedTotal: 1500000,
                customer: { id: 1, fullName: 'Nguyễn Văn Minh', phone: '0908111222' },
                vehicle: { id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry', year: 2023 },
              },
            ]
          : [
              {
                type: 'INVOICE',
                id: 101,
                invoiceNumber: 'INV-2026-101',
                status: tab === 'ALL' ? 'ISSUED' : tab,
                totalAmount: 1500000,
                amountDue: 1500000,
                customer: { id: 1, fullName: 'Nguyễn Văn Minh', phone: '0908111222' },
                vehicle: { id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry', year: 2023 },
              },
            ];

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tab,
            summary: {
              pendingCount: 2,
              draftCount: 1,
              issuedCount: 1,
              paidTodayCount: 4,
              paidTodayRevenue: 12500000,
            },
            records,
          },
          meta: { pagination: { total: 8, count: records.length, totalPages: 2, currentPage: 1, perPage: 5 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/billing', { waitUntil: 'domcontentloaded' });

    // Error state & Retry recovery
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.locator('text=WO-2026-501').first()).toBeVisible({ timeout: 10000 });

    // Switch tab to ISSUED
    await page.locator('button:has-text("Chờ thanh toán")').last().click();
    await expect(page.locator('text=INV-2026-101').first()).toBeVisible({ timeout: 10000 });

    // Search non-matching query -> Empty state -> Xóa tìm kiếm
    const searchInput = page.locator('input[placeholder="Tìm biển số, mã phiếu WO, tên khách hàng..."]');
    await searchInput.fill('NO_MATCH_999');
    await expect(page.getByRole('button', { name: 'Xóa tìm kiếm' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
    await expect(page.locator('text=INV-2026-101').first()).toBeVisible({ timeout: 10000 });
  });

  test('E2E-STF-BIL-02: /staff/billing/101 mở PaymentModal (VietQR SePay & Tiền mặt), tính tiền thối & pass 4 viewports', async ({
    page,
  }) => {
    let paid = false;
    let manualPayload: any = null;
    let sepayCalled = false;

    await page.route('**/api/invoices/101/payments/sepay', async (route) => {
      sepayCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            paymentId: 901,
            invoiceId: 101,
            invoiceNumber: 'INV-2026-101',
            amount: 1500000,
            checkoutUrl: 'https://qr.sepay.vn/mock',
            fields: {},
            bankInfo: {
              bankCode: 'MB',
              bankName: 'MBBank',
              accountNumber: '0999888777',
              accountName: 'AUTOCARE SERVICE CENTER',
              transferContent: 'TT INV2026101',
              amount: 1500000,
              qrCodeUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"></svg>',
            },
          },
        }),
      });
    });

    await page.route('**/api/invoices/101/payments/status', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            invoiceId: 101,
            invoiceNumber: 'INV-2026-101',
            status: paid ? 'PAID' : 'ISSUED',
            amountDue: paid ? 0 : 1500000,
            isPaid: paid,
          },
        }),
      });
    });

    await page.route('**/api/invoices/101/payments', async (route) => {
      manualPayload = route.request().postDataJSON();
      paid = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Thanh toán thành công',
          data: {
            paymentId: 902,
            invoiceId: 101,
            invoiceNumber: 'INV-2026-101',
            paymentMethod: 'CASH',
            amount: 1500000,
            tenderedAmount: 2000000,
            changeAmount: 500000,
            invoiceStatus: 'PAID',
          },
        }),
      });
    });

    await page.route('**/api/invoices/101', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: paid
            ? {
                ...MOCK_ISSUED_INVOICE,
                status: 'PAID',
                amountDue: 0,
                paidAt: new Date().toISOString(),
              }
            : MOCK_ISSUED_INVOICE,
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/billing/101', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("INV-2026-101")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=51F-555.66').first()).toBeVisible();

    await page.getByRole('button', { name: 'Thu tiền ngay' }).click();
    await expect(page.locator('h2:has-text("Thanh toán hóa đơn")')).toBeVisible();

    // Check SePay QR tab first
    await page.getByRole('button', { name: 'Chuyển khoản VietQR' }).click();
    await expect(page.locator('img[alt="VietQR SePay"]')).toBeVisible({ timeout: 10000 });
    expect(sepayCalled).toBe(true);

    // Switch back to Cash tab, test change calculation and submit
    await page.getByRole('button', { name: 'Tiền mặt' }).click();
    const cashInput = page.locator('input[type="number"]').first();
    await cashInput.fill('2000000');
    await expect(page.getByText('500.000 đ', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Xác nhận đã thu tiền' }).click();
    await expect(page.locator('text=Đã quyết toán tài chính 100%')).toBeVisible({ timeout: 10000 });
    expect(manualPayload).toMatchObject({
      paymentMethod: 'CASH',
      amount: 1500000,
      tenderedAmount: 2000000,
    });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });
});
