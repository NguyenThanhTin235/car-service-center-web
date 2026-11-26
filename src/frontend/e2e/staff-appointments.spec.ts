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
          data: [
            {
              id: 1,
              fullName: 'Nguyễn Minh Quân',
              phone: '0909111222',
              vehicles: [{ id: 10, licensePlate: '30H-123.45', make: 'Toyota', model: 'Camry', color: 'Đen' }],
            },
          ],
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
      const url = new URL(route.request().url());
      const q = (url.searchParams.get('search') || '').trim().toLowerCase();
      const filtered = q
        ? MOCK_APPOINTMENTS.filter(
            (a) =>
              a.vehicle.license_plate.toLowerCase().includes(q) ||
              a.customer.full_name.toLowerCase().includes(q) ||
              a.customer.phone.includes(q)
          )
        : MOCK_APPOINTMENTS;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filtered,
          pagination: { page: 1, limit: 50, total: filtered.length },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/appointments', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("+ Thêm lịch hẹn mới")').first()).toBeVisible({ timeout: 20000 });
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

    // Open CreateAppointmentModal and verify 3-step wizard (identical UI to customer-web profile booking)
    await page.locator('button:has-text("+ Thêm lịch hẹn mới")').first().click();
    await expect(page.locator('h2:has-text("Đặt lịch hẹn mới")')).toBeVisible();
    await expect(page.getByText('Chọn xe', { exact: true })).toBeVisible();
    await expect(page.locator('text=Dịch vụ & Mô tả')).toBeVisible();
    await expect(page.locator('text=Ngày & Giờ')).toBeVisible();

    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.locator('text=Vui lòng chọn khách hàng.')).toBeVisible();

    await page.locator('input[list="customers-list"]').fill('Nguyễn Minh Quân - 0909111222');
    await page.locator('text=30H-123.45').last().click();
    await page.getByRole('button', { name: /Tiếp tục/i }).click();

    await expect(page.locator('text=Dịch vụ yêu cầu & Mô tả tình trạng')).toBeVisible();
    await page.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.locator('text=Vui lòng chọn dịch vụ hoặc mô tả tình trạng xe.')).toBeVisible();

    await page.locator('h4:has-text("Bảo dưỡng phanh")').click();
    await page.getByRole('button', { name: /Tiếp tục/i }).click();

    await expect(page.locator('text=Chọn ngày & khung giờ tiếp nhận')).toBeVisible();
    await expect(page.locator('text=Buổi sáng (07:30 - 11:30)')).toBeVisible();
    await expect(page.locator('text=Buổi chiều (13:30 - 17:30)')).toBeVisible();
    await expect(page.locator('text=Tóm tắt phiếu đặt hẹn:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xác nhận đặt lịch' })).toBeVisible();

    // Select a future date (tomorrow) & time slot and submit to verify success toast
    await page.route('**/api/appointments', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 999 } }),
        });
      }
      return route.fallback();
    });

    const tomorrow = new Date(Date.now() + 86400000);
    if (tomorrow.getMonth() !== new Date().getMonth()) {
      await page.locator('button:has-text("›")').click();
    }
    await page.locator('.grid-cols-7 button').filter({ hasText: new RegExp(`^${tomorrow.getDate()}$`) }).click();
    await page.getByRole('button', { name: '09:00', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận đặt lịch' }).click();

    await expect(page.locator('text=Đặt lịch hẹn thành công!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Đặt lịch hẹn mới")')).toHaveCount(0);
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

  test('E2E-STF-APT-03: Thêm nhanh phương tiện ở Bước 1 khi khách hàng chưa có xe', async ({ page }) => {
    await page.route('**/api/customers**', async (route) => {
      if (route.request().method() === 'POST' && route.request().url().includes('/vehicles')) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Thêm phương tiện thành công',
            data: {
              id: 77,
              licensePlate: '51A-999.88',
              make: 'Honda',
              model: 'Civic',
              color: 'Trắng',
              vehicleSize: 'MEDIUM',
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: 2,
              fullName: 'Trần Thị Bích',
              phone: '0912345678',
              vehicles: [],
            },
          ],
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/appointments', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('button:has-text("+ Thêm lịch hẹn mới")').first()).toBeVisible({ timeout: 20000 });

    await page.locator('button:has-text("+ Thêm lịch hẹn mới")').first().click();
    await expect(page.locator('h2:has-text("Đặt lịch hẹn mới")')).toBeVisible();

    await page.locator('input[list="customers-list"]').fill('Trần Thị Bích - 0912345678');
    await expect(page.locator('text=Chưa có phương tiện trong hồ sơ')).toBeVisible();

    await page.getByRole('button', { name: '+ Thêm phương tiện' }).click();
    await expect(page.locator('h3:has-text("Thêm phương tiện mới")')).toBeVisible();

    await page.locator('input[placeholder="VD: 51A-123.45"]').fill('51A-999.88');
    await page.locator('input[placeholder="VD: Toyota"]').fill('Honda');
    await page.locator('input[placeholder="VD: Camry"]').fill('Civic');
    await page.locator('input[placeholder="VD: Đen"]').fill('Trắng');
    await page.getByRole('button', { name: 'Lưu phương tiện' }).click();

    await expect(page.locator('text=Thêm phương tiện mới thành công!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3:has-text("Thêm phương tiện mới")')).toHaveCount(0);
    await expect(page.locator('text=51A-999.88').first()).toBeVisible();
    await expect(page.locator('text=Honda Civic').first()).toBeVisible();
    await expect(page.locator('text=Đang chọn').first()).toBeVisible();
  });
});
