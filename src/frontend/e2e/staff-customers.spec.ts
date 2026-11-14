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

const MOCK_ACTIVE_CUSTOMERS = [
  {
    id: 1,
    fullName: 'Lê Thị Hoa',
    phone: '0909123456',
    email: 'hoa@example.com',
    address: 'Quận 1, TP.HCM',
    isActive: true,
    vehicles: [
      { id: 10, licensePlate: '51H-888.99', make: 'Toyota', model: 'Vios', color: 'Trắng', vehicleSize: 'SMALL' },
    ],
    stats: { totalVisits: 4, totalSpent: 8500000, lastVisitDate: '2026-11-10T00:00:00Z', lastService: 'Bảo dưỡng định kỳ' },
  },
];

const MOCK_DELETED_CUSTOMERS = [
  {
    id: 2,
    fullName: 'Ngô Văn Cũ',
    phone: '0911222333',
    email: '',
    address: 'Thủ Đức',
    isActive: false,
    vehicles: [],
    stats: { totalVisits: 0, totalSpent: 0, lastVisitDate: null, lastService: null },
  },
];

test.describe('Desk-Staff Portal E2E: Customers (/staff/customers)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt-token');
    }, CURRENT_STAFF);
  });

  test('E2E-STF-CUS-01: Hiển thị khách hàng, chuyển tab, và inline validation CustomerFormModal (validators.ts)', async ({
    page,
  }) => {
    await page.route('**/api/customers**', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status') || 'active';
      const data = status === 'deleted' ? MOCK_DELETED_CUSTOMERS : MOCK_ACTIVE_CUSTOMERS;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data,
          pagination: { totalRecords: data.length, totalPages: 1, currentPage: 1, limit: 5 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/customers', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Lê Thị Hoa').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=51H-888.99').first()).toBeVisible();

    // Switch tab to Deleted and back to Active
    await page.getByRole('button', { name: /Đã vô hiệu hóa/i }).click();
    await expect(page.locator('text=Ngô Văn Cũ').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Đang hoạt động/i }).click();
    await expect(page.locator('text=Lê Thị Hoa').first()).toBeVisible({ timeout: 10000 });

    // Open CustomerFormModal & verify validators.ts rules
    await page.locator('button:has-text("+ Thêm mới")').first().click();
    await expect(page.locator('text=Thêm mới Khách hàng & Phương tiện')).toBeVisible();

    // Empty submit validates name & phone, while empty optional email passes without email error
    await page.getByRole('button', { name: 'Lưu khách hàng & Phương tiện' }).click();
    await expect(page.locator('text=Họ và tên khách hàng không được để trống')).toBeVisible();
    await expect(page.locator('text=Số điện thoại không được để trống')).toBeVisible();
    await expect(page.locator('text=Email không được để trống')).toHaveCount(0);

    // Entering malformed email + invalid license plate displays inline errors (first vehicle row is pre-rendered)
    await page.locator('input[placeholder="Nguyễn Văn A"]').fill('Nguyễn Văn An');
    await page.locator('input[placeholder="0912345678"]').fill('0909888777');
    await page.locator('input[placeholder="khachhang@example.com"]').fill('bad-email');
    await page.locator('input[placeholder="51H-123.45"]').first().fill('BAD_PLATE');

    await page.getByRole('button', { name: 'Lưu khách hàng & Phương tiện' }).click();
    await expect(page.locator('text=Định dạng email không hợp lệ.')).toBeVisible();
    await expect(
      page.locator('text=Biển số xe không đúng định dạng (VD: 51K-888.99 hoặc 30A-12345)')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Hủy bỏ' }).click();
  });

  test('E2E-STF-CUS-02: Error banner Retry khi API 500, Empty state + CTA và audit 4 viewports', async ({
    page,
  }) => {
    let calls = 0;
    await page.route('**/api/customers**', async (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Không thể kết nối máy chủ khách hàng' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 5 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/customers', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Không thể kết nối máy chủ khách hàng')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Thử lại' }).click();

    await expect(page.locator('text=Chưa có hồ sơ khách hàng nào trong danh sách')).toBeVisible({
      timeout: 10000,
    });
    expect(calls).toBeGreaterThanOrEqual(2);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });

  test('E2E-STF-CUS-03: CustomerDetailModal hiển thị Lịch sử dịch vụ tại xưởng & Retry khi lỗi', async ({
    page,
  }) => {
    await page.route('**/api/customers?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: MOCK_ACTIVE_CUSTOMERS,
          pagination: { totalRecords: 1, totalPages: 1, currentPage: 1, limit: 5 },
        }),
      });
    });

    let historyCalls = 0;
    await page.route('**/api/customers/1/service-history', async (route) => {
      historyCalls += 1;
      if (historyCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Lỗi tải lịch sử dịch vụ' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            summary: { totalOrders: 2, totalVisits: 1, totalSpent: 4500000 },
            records: [
              {
                id: 501,
                woNumber: 'WO-2026-011',
                status: 'CLOSED',
                orderType: 'STANDARD',
                createdAt: '2026-11-10T08:00:00Z',
                closedAt: '2026-11-10T16:00:00Z',
                mileage: 45200,
                vehicle: { id: 10, licensePlate: '51H-888.99', make: 'Toyota', model: 'Vios', year: 2023 },
                advisor: { id: 4, fullName: 'Lễ Tân Lan' },
                services: [
                  { id: 1, name: 'Bảo dưỡng 40.000 km', status: 'COMPLETED' },
                  { id: 2, name: 'Thay dầu động cơ', status: 'COMPLETED' },
                ],
                invoice: {
                  id: 88,
                  invoiceNumber: 'INV-2026-088',
                  status: 'PAID',
                  totalAmount: 4500000,
                  paidAt: '2026-11-10T16:00:00Z',
                },
              },
              {
                id: 500,
                woNumber: 'WO-2026-005',
                status: 'IN_PROGRESS',
                orderType: 'WARRANTY',
                createdAt: '2026-11-12T09:00:00Z',
                closedAt: null,
                mileage: null,
                vehicle: { id: 10, licensePlate: '51H-888.99', make: 'Toyota', model: 'Vios', year: 2023 },
                advisor: null,
                services: [{ id: 3, name: 'Kiểm tra hệ thống lạnh', status: 'IN_PROGRESS' }],
                invoice: null,
              },
            ],
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/customers', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Lê Thị Hoa').first()).toBeVisible({ timeout: 20000 });
    await page.locator('button[title="Xem hồ sơ"]').first().click();

    await expect(page.locator('text=Hồ sơ chi tiết Khách hàng')).toBeVisible();
    await expect(page.getByTestId('service-history-error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Lỗi tải lịch sử dịch vụ')).toBeVisible();

    await page.getByTestId('service-history-error').getByRole('button', { name: 'Thử lại' }).click();

    await expect(page.getByTestId('service-history-list')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('service-history-item-WO-2026-011')).toBeVisible();
    await expect(page.getByTestId('service-history-item-WO-2026-005')).toBeVisible();
    await expect(page.locator('text=Bảo dưỡng 40.000 km')).toBeVisible();
    await expect(page.locator('text=45.200 km')).toBeVisible();
    await expect(page.locator('a[href="/staff/billing/88"]')).toContainText('INV-2026-088');
    await expect(page.locator('text=Bảo hành')).toBeVisible();
    expect(historyCalls).toBe(2);

    // Click "Xem chi tiết phiếu" to open ReadOnlyROModal (shared with /staff/intake)
    await page.route('**/api/work-orders/501', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 501,
            wo_number: 'WO-2026-011',
            status: 'CLOSED',
            source_type: 'WALK_IN',
            order_type: 'STANDARD',
            created_at: '2026-11-10T08:00:00Z',
            customer: { id: 1, full_name: 'Lê Thị Hoa', phone: '0909123456', email: 'hoa@example.com' },
            vehicle: { id: 10, license_plate: '51H-888.99', make: 'Toyota', model: 'Vios', color: 'Trắng', vehicle_size: 'SMALL' },
            advisor: { id: 4, full_name: 'Lễ Tân Lan', phone: '0901111222' },
            check_in: { mileage: 45200 },
            services: [
              {
                id: 1,
                name: 'Bảo dưỡng 40.000 km',
                pricing_type: 'FIXED',
                status: 'COMPLETED',
                jobs: [{ id: 11, name: 'Kiểm tra tổng quát', status: 'COMPLETED', parts: [] }],
              },
            ],
            quotations: [],
            invoices: [{ id: 88, invoice_number: 'INV-2026-088', status: 'PAID', total_amount: 4500000 }],
          },
        }),
      });
    });

    await page.getByTestId('view-wo-detail-WO-2026-011').click();
    await expect(page.locator('text=Chi tiết Lệnh sửa chữa:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ODO: 45.200 km')).toBeVisible();
    await expect(page.locator('text=Bay 4')).toHaveCount(0);
    await page.locator('button:has(span:text-is("close"))').last().click();

    await page.getByRole('button', { name: 'Đóng hồ sơ' }).click();
  });
});
