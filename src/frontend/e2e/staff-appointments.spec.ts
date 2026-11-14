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

const todayIso = new Date().toISOString().substring(0, 10);

const MOCK_APPOINTMENTS = [
  {
    id: 401,
    customer_id: 1,
    vehicle_id: 10,
    scheduled_date: todayIso,
    scheduled_time: '09:00',
    scheduled_time_str: '09:00',
    status: 'CONFIRMED',
    notes: 'Kiểm tra hệ thống phanh',
    customer: { id: 1, full_name: 'Nguyễn Minh Quân', phone: '0909111222' },
    vehicle: { id: 10, license_plate: '30H-123.45', make: 'Toyota', model: 'Camry' },
    services: [{ id: 1, name: 'Bảo dưỡng phanh' }],
  },
  {
    id: 402,
    customer_id: 2,
    vehicle_id: 11,
    scheduled_date: todayIso,
    scheduled_time: '14:00',
    scheduled_time_str: '14:00',
    status: 'REQUESTED',
    notes: 'Thay nhớt 5.000 km',
    customer: { id: 2, full_name: 'Trần Thị Bích', phone: '0912345678' },
    vehicle: { id: 11, license_plate: '51G-777.88', make: 'Mazda', model: 'CX-5' },
    services: [{ id: 2, name: 'Thay nhớt' }],
  },
];

test.describe('Desk-Staff Portal E2E: Appointments (/staff/appointments)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 50 },
        }),
      });
    });

    await page.route('**/api/customers**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [{ id: 1, fullName: 'Nguyễn Minh Quân', phone: '0909111222', vehicles: [] }],
        }),
      });
    });

    await page.route('**/api/services**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 1, name: 'Bảo dưỡng phanh', base_price: 500000 }],
        }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt-token');
    }, CURRENT_STAFF);
  });

  test('E2E-STF-APT-01: Chuyển view Ngày/Tuần/Tháng, lọc nhanh, mở & validate CreateAppointmentModal', async ({
    page,
  }) => {
    await page.route('**/api/appointments**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_APPOINTMENTS,
          pagination: { page: 1, limit: 50, total: 2 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/appointments', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Lịch hẹn khách hàng")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=30H-123.45').first()).toBeVisible();
    await expect(page.locator('text=51G-777.88').first()).toBeVisible();

    // Switch Day / Week / Month views
    await page.getByRole('button', { name: 'Tuần', exact: true }).click();
    await expect(page.locator('text=30H-123.45').first()).toBeVisible();

    await page.getByRole('button', { name: 'Tháng', exact: true }).click();
    await page.getByRole('button', { name: 'Ngày', exact: true }).click();

    // Search filter
    const searchInput = page.locator(
      'input[placeholder="Lọc nhanh tên khách hàng, số điện thoại hoặc biển số xe..."]'
    );
    await searchInput.fill('30H-123');
    await expect(page.locator('text=30H-123.45').first()).toBeVisible();
    await expect(page.locator('text=51G-777.88')).toHaveCount(0);
    await searchInput.fill('');

    // Open CreateAppointmentModal and verify empty validation
    await page.locator('button:has-text("+ Thêm lịch hẹn mới")').first().click();
    await expect(page.locator('h2:has-text("Thêm lịch hẹn mới")')).toBeVisible();

    await page.getByRole('button', { name: 'Lưu lịch hẹn' }).click();
    await expect(page.locator('text=Vui lòng điền đầy đủ thông tin bắt buộc')).toBeVisible();

    await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();
    await expect(page.locator('h2:has-text("Thêm lịch hẹn mới")')).toHaveCount(0);
  });

  test('E2E-STF-APT-02: Error banner Retry khi API 500, Empty state và audit 4 viewports', async ({
    page,
  }) => {
    let calls = 0;
    await page.route('**/api/appointments**', async (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Database unavailable' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { page: 1, limit: 50, total: 0 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/appointments', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Không thể tải lịch hẹn:')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Thử lại' }).click();

    await expect(page.locator('text=Chưa có lịch hẹn nào trong khoảng thời gian này.')).toBeVisible({
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
});
