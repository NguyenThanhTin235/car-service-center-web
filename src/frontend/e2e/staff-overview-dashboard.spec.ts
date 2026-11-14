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

const MOCK_INTAKE_RECORDS = [
  {
    id: 201,
    customer_id: 1,
    vehicle_id: 10,
    intake_type: 'WALK_IN',
    status: 'QUEUED',
    arrived_at: new Date().toISOString(),
    notes: 'Bảo dưỡng cấp 40.000 km',
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', color: 'Xanh', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [{ id: 1, service: { id: 1, name: 'Thay nhớt động cơ' } }],
  },
  {
    id: 202,
    customer_id: 2,
    vehicle_id: 11,
    intake_type: 'TOW_IN',
    status: 'CONVERTED',
    arrived_at: new Date().toISOString(),
    tow_company: 'Cứu hộ 115 HCM',
    notes: 'Xe chết máy giữa đường',
    customer: { id: 2, full_name: 'Trần Minh Quân', phone: '0909333444', email: 'quan@gmail.com' },
    vehicle: { id: 11, license_plate: '30E-456.78', make: 'Hyundai', model: 'Tucson', color: 'Trắng', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
];

test.describe('Desk-Staff Portal E2E: Overview (/staff) & Command Dashboard (/staff/dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [],
          meta: { pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.route('**/api/appointments**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 301,
              customer_id: 3,
              vehicle_id: 12,
              scheduled_date: new Date().toISOString().substring(0, 10),
              scheduled_time: '09:30',
              scheduled_time_str: '09:30',
              status: 'CONFIRMED',
              customer: { id: 3, full_name: 'Lê Minh Tuấn', phone: '0909111222' },
              vehicle: { id: 12, license_plate: '30H-123.45', make: 'Toyota', model: 'Camry' },
            },
          ],
          pagination: { page: 1, limit: 50, total: 1 },
        }),
      });
    });

    await page.route('**/api/invoices/billing-queue**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tab: 'PENDING',
            summary: {
              pendingCount: 2,
              draftCount: 1,
              issuedCount: 1,
              paidTodayCount: 4,
              paidTodayRevenue: 12500000,
            },
            records: [],
          },
          meta: { pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt-token');
    }, CURRENT_STAFF);
  });

  test('E2E-STF-OVR-01: /staff hiển thị Bento Grid, Wave Chart, lọc Live Queue và điều hướng tới /staff/intake', async ({
    page,
  }) => {
    await page.route('**/api/intake**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_INTAKE_RECORDS,
          meta: { pagination: { total: 2, count: 2, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('staff-bento-grid')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('staff-wave-chart')).toBeVisible();
    await expect(page.getByTestId('staff-live-queue-table')).toBeVisible();
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();
    await expect(page.locator('text=30E-456.78').first()).toBeVisible();

    const searchInput = page.locator('input[placeholder="Lọc nhanh biển số, tên KH..."]');
    await searchInput.fill('51K-888');
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();
    await expect(page.locator('text=30E-456.78')).toHaveCount(0);

    // Click Chi tiết opens IntakeDetailModal without navigating away from /staff
    await page.getByRole('button', { name: /Chi tiết/i }).first().click();
    await expect(page.locator('h2:has-text("Chi tiết phiếu tiếp nhận")')).toBeVisible();
    await expect(page).toHaveURL(/\/staff$/);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.locator('h2:has-text("Chi tiết phiếu tiếp nhận")')).toHaveCount(0);

    await page.click('a:has-text("Tiếp nhận xe mới")');
    await expect(page).toHaveURL(/\/staff\/intake/);
    await expect(page.locator('h1:has-text("Tiếp nhận xe vào xưởng")')).toBeVisible({ timeout: 15000 });
  });

  test('E2E-STF-OVR-02: /staff hiển thị banner lỗi và nút Thử lại khi API lỗi 500, phục hồi khi Retry', async ({
    page,
  }) => {
    let intakeCalls = 0;
    await page.route('**/api/intake**', async (route) => {
      intakeCalls += 1;
      if (intakeCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [MOCK_INTAKE_RECORDS[0]],
          meta: { pagination: { total: 1, count: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Không thể đồng bộ dữ liệu quầy dịch vụ')).toBeVisible({ timeout: 20000 });
    const retryBtn = page.getByRole('button', { name: 'Thử lại' });
    await expect(retryBtn).toBeVisible();

    await retryBtn.click();
    await expect(page.locator('text=51K-888.99').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Không thể đồng bộ dữ liệu quầy dịch vụ')).toHaveCount(0);
    expect(intakeCalls).toBeGreaterThanOrEqual(2);
  });

  test('E2E-STF-DASH-01: /staff/dashboard render sạch không lỗi hydration, đổi filter scope và pass 4 viewports', async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('hydration')) {
        hydrationErrors.push(msg.text());
      }
    });

    const capturedParams: Array<{ period: string | null; scope: string | null }> = [];

    await page.route('**/api/dashboard/staff**', async (route) => {
      const url = new URL(route.request().url());
      const period = url.searchParams.get('period');
      const scope = url.searchParams.get('scope');
      capturedParams.push({ period, scope });

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            portal: 'staff',
            period: { key: period || '7days', startDate: '2026-11-01', endDate: '2026-11-14' },
            kpis: [
              { key: 'activeJobsCount', label: 'Hạng mục đang làm', value: 6, prevValue: 4, format: 'number' },
              { key: 'completedTodayCount', label: 'Hoàn thành hôm nay', value: 12, prevValue: 9, format: 'number' },
              { key: 'appointmentsToday', label: 'Lịch hẹn hôm nay', value: 8, prevValue: 7, format: 'number' },
              { key: 'intakeQueueCount', label: 'Xe chờ tiếp nhận', value: 5, prevValue: 3, format: 'number' },
            ],
            charts: {
              jobStatus: [
                { category: 'Đang làm', count: 6 },
                { category: 'Hoàn thành', count: 12 },
              ],
            },
            actionableList: [
              {
                id: 1,
                name: 'Thay má phanh trước',
                woNumber: 'WO-2026-501',
                vehiclePlate: '51G-999.88',
                status: 'IN_PROGRESS',
                estimatedHours: 1.5,
              },
            ],
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Bảng Điều Phối Kỹ Thuật Viên & Tiếp Nhận")')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator('text=Tiến độ thực thi nhiệm vụ kỹ thuật qua các khâu')).toBeVisible();
    await expect(page.locator('text=Mật độ xe theo khung giờ ca trực')).toBeVisible();
    await expect(page.locator('text=Thay má phanh trước').first()).toBeVisible();
    await expect(page.locator('th:has-text("Mã lệnh (WO)")')).toBeVisible();
    await expect(page.locator('th:has-text("Biển số xe")')).toBeVisible();
    await expect(page.locator('th:has-text("Thao tác")')).toHaveCount(0);
    await expect(page.locator('text=WO-2026-501').first()).toBeVisible();
    await expect(page.locator('text=51G-999.88').first()).toBeVisible();

    await expect(page.getByRole('button', { name: /Việc của tôi/i })).toHaveCount(0);
    await expect(page.locator('text=Toàn bộ chuyền xưởng').first()).toBeVisible();
    expect(capturedParams.some((p) => p.scope === 'workshop')).toBe(true);

    expect(hydrationErrors).toEqual([]);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });
});
