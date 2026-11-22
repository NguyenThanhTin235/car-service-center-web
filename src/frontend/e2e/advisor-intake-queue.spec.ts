import { test, expect } from '@playwright/test';

const CURRENT_SA = {
  id: 2,
  email: 'advisor@autocare.vn',
  fullName: 'Trần Cố Vấn',
  roles: ['SA'],
};

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-960', width: 960, height: 1440 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const MOCK_INTAKE_QUEUE = [
  {
    id: 201,
    intake_type: 'WALK_IN',
    status: 'QUEUED',
    arrived_at: new Date(Date.now() - 15 * 60000).toISOString(),
    notes: '[Tình trạng xe]: Trầy nhẹ cản trước\n\n[Ghi chú]: Kiểm tra bảo dưỡng gầm',
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', color: 'Xanh', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [{ id: 1, service: { id: 1, name: 'Bảo dưỡng gầm' } }],
  },
  {
    id: 202,
    intake_type: 'TOW_IN',
    status: 'QUEUED',
    arrived_at: new Date(Date.now() - 45 * 60000).toISOString(),
    notes: 'Xe chết máy trên cao tốc',
    customer: { id: 2, full_name: 'Nguyễn Văn Sơn', phone: '0933444555', email: 'son@gmail.com' },
    vehicle: { id: 11, license_plate: '51D-777.00', make: 'Ford', model: 'Ranger', color: 'Bạc', vehicle_size: 'LARGE' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
  {
    id: 203,
    intake_type: 'APPOINTMENT',
    status: 'CONVERTED',
    arrived_at: new Date(Date.now() - 90 * 60000).toISOString(),
    notes: 'Đã lập phiếu công việc',
    customer: { id: 3, full_name: 'Lê Hoàng Long', phone: '0919555666', email: 'long@gmail.com' },
    vehicle: { id: 12, license_plate: '51A-999.11', make: 'Toyota', model: 'Vios', color: 'Đen', vehicle_size: 'SMALL' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    work_order: { id: 90, wo_number: 'WO-2026-090' },
    services: [],
  },
  {
    id: 204,
    intake_type: 'WALK_IN',
    status: 'CANCELLED',
    arrived_at: new Date(Date.now() - 120 * 60000).toISOString(),
    notes: 'Khách bận việc đột xuất',
    customer: { id: 4, full_name: 'Trần Văn Bình', phone: '0908777666', email: 'binh@gmail.com' },
    vehicle: { id: 13, license_plate: '51G-111.22', make: 'Honda', model: 'City', color: 'Trắng', vehicle_size: 'SMALL' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
];

test.describe('Service Advisor Portal E2E: Intake Queue (/advisor/intake-queue)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { pagination: { total: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-sa-jwt-token');
    }, CURRENT_SA);
  });

  test('E2E-SA-INT-01: Stats, 3 tabs QUEUED/CONVERTED/CANCELLED, IntakeDetailModal với Cỡ vừa & tạo WO redirect', async ({
    page,
  }) => {
    await page.route('**/api/work-orders/intake-queue**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_INTAKE_QUEUE,
        }),
      });
    });

    await page.route('**/api/work-orders', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 501, wo_number: 'WO-2026-501', status: 'DRAFT' },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/intake-queue', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Danh sách xe đang chờ")')).toBeVisible({ timeout: 20000 });

    // Stats & QUEUED tab default
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();
    await expect(page.locator('text=51D-777.00').first()).toBeVisible();

    // Switch to CONVERTED tab
    await page.getByRole('button', { name: /Đã chuyển phiếu/i }).click();
    await expect(page.locator('text=51A-999.11').first()).toBeVisible();
    await expect(page.locator('text=51K-888.99')).toHaveCount(0);

    // Switch to CANCELLED tab
    await page.getByRole('button', { name: /Đã hủy/i }).click();
    await expect(page.locator('text=51G-111.22').first()).toBeVisible();
    await expect(page.locator('text=51A-999.11')).toHaveCount(0);

    // Switch back to QUEUED tab
    await page.getByRole('button', { name: /Chờ xử lý/i }).click();
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();

    // Click row to open IntakeDetailModal and verify Vietnamese vehicle size 'Cỡ vừa'
    await page.locator('tr', { hasText: '51K-888.99' }).first().click();
    await expect(page.locator('h2:has-text("Chi tiết xe chờ tiếp nhận")')).toBeVisible();
    await expect(page.locator('text=Cỡ vừa')).toBeVisible();

    // Create WO and verify redirect
    await page.getByRole('button', { name: /Tạo phiếu công việc ngay/i }).click();
    await expect(page).toHaveURL(/\/advisor\/work-orders\/501/, { timeout: 15000 });
  });

  test('E2E-SA-INT-02: Empty state, Error toast + Retry via Làm mới, và 5 viewports', async ({
    page,
  }) => {
    let queueCalls = 0;
    let queueMode: 'error' | 'empty' | 'data' = 'error';
    await page.route('**/api/work-orders/intake-queue**', async (route) => {
      queueCalls += 1;
      if (queueMode === 'error') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Server error' }),
        });
      }
      if (queueMode === 'empty') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [MOCK_INTAKE_QUEUE[0]] }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/intake-queue', { waitUntil: 'domcontentloaded' });

    // Call 1: 500 error toast + empty fallback
    await expect(page.locator('text=Lỗi tải danh sách chờ').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Không có xe nào đang chờ')).toBeVisible();

    // Call 2: Retry -> Empty state
    queueMode = 'empty';
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect(page.locator('text=Không có xe nào đang chờ')).toBeVisible({ timeout: 10000 });

    // Call 3: Retry -> Data loaded
    queueMode = 'data';
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect(page.locator('text=51K-888.99').first()).toBeVisible({ timeout: 10000 });
    expect(queueCalls).toBeGreaterThanOrEqual(3);

    // 5 viewports check
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });
});
