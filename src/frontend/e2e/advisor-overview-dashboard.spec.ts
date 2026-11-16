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

const MOCK_WORK_ORDERS = [
  {
    id: 101,
    wo_number: 'WO-2026-101',
    status: 'IN_PROGRESS',
    source_type: 'WALK_IN',
    created_at: new Date().toISOString(),
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', year: 2022, color: 'Xanh', vehicle_size: 'MEDIUM' },
    advisor: { id: 2, full_name: 'Trần Cố Vấn' },
  },
  {
    id: 102,
    wo_number: 'WO-2026-102',
    status: 'PENDING_APPROVAL',
    source_type: 'APPOINTMENT',
    created_at: new Date().toISOString(),
    customer: { id: 2, full_name: 'Nguyễn Thị Hoa', phone: '0909444555', email: 'hoa@gmail.com' },
    vehicle: { id: 11, license_plate: '30H-456.78', make: 'Toyota', model: 'Camry', year: 2021, color: 'Đen', vehicle_size: 'MEDIUM' },
    advisor: { id: 2, full_name: 'Trần Cố Vấn' },
  },
  {
    id: 103,
    wo_number: 'WO-2026-103',
    status: 'FINANCIAL_CLEARED',
    source_type: 'WALK_IN',
    created_at: new Date().toISOString(),
    customer: { id: 3, full_name: 'Lê Minh Tuấn', phone: '0919666777', email: 'tuan@gmail.com' },
    vehicle: { id: 12, license_plate: '51G-123.45', make: 'Honda', model: 'CR-V', year: 2023, color: 'Trắng', vehicle_size: 'LARGE' },
    advisor: { id: 2, full_name: 'Trần Cố Vấn' },
  },
];

const MOCK_INTAKE_QUEUE = [
  {
    id: 201,
    intake_type: 'WALK_IN',
    status: 'QUEUED',
    arrived_at: new Date().toISOString(),
    notes: 'Kiểm tra gầm',
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', color: 'Xanh', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
  {
    id: 202,
    intake_type: 'APPOINTMENT',
    status: 'CONVERTED',
    arrived_at: new Date(Date.now() - 45 * 60000).toISOString(),
    notes: 'Bảo dưỡng định kỳ',
    customer: { id: 2, full_name: 'Nguyễn Thị Hoa', phone: '0909444555', email: 'hoa@gmail.com' },
    vehicle: { id: 11, license_plate: '30H-456.78', make: 'Toyota', model: 'Camry', color: 'Đen', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
];

test.describe('Service Advisor Portal E2E: Overview (/advisor) & Analytics Dashboard (/advisor/dashboard)', () => {
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

  test('E2E-SA-OVR-01: /advisor Bento cards, 8-stage bars, WO table, right widget filters, Error + Retry & 5 viewports', async ({
    page,
  }) => {
    let failNextLoad = false;
    let woCalls = 0;

    await page.route('**/api/work-orders**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/intake-queue')) {
        if (failNextLoad) {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Server error' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_INTAKE_QUEUE }),
        });
      }

      woCalls += 1;
      if (failNextLoad) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Server error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_WORK_ORDERS,
          meta: { pagination: { total: MOCK_WORK_ORDERS.length, totalPages: 1, currentPage: 1, perPage: 50 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor', { waitUntil: 'domcontentloaded' });

    // 1. 3-Tone Hero Bento Cards
    const heroGrid = page.getByTestId('sa-hero-bento-grid');
    await expect(heroGrid).toBeVisible({ timeout: 20000 });
    await expect(heroGrid.locator('text=Tổng Phiếu Công Việc')).toBeVisible();
    await expect(heroGrid.locator('text=Hàng Đợi Tiếp Nhận')).toBeVisible();
    await expect(heroGrid.locator('text=Sẵn Sàng & Hoàn Tất')).toBeVisible();

    // 2. 8-Stage Bars
    await expect(page.locator('text=Phân bổ phiếu công việc theo giai đoạn')).toBeVisible();
    for (const stage of ['Tiếp nhận', 'Kế hoạch', 'Chờ duyệt', 'Đã duyệt', 'Đang sửa', 'Chờ TT', 'Chờ giao', 'Hoàn tất']) {
      await expect(page.locator(`text=${stage}`).first()).toBeVisible();
    }

    // 3. Work Orders Table
    await expect(page.locator('text=Phiếu công việc cần xử lý')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-101', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-102', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-103', exact: true })).toBeVisible();

    // 4. Right Widget Filters: Phân loại trạng thái
    const statusWidget = page.locator('div', { hasText: 'Phân loại trạng thái' }).filter({ has: page.getByRole('button', { name: 'Chờ duyệt' }) }).last();
    await statusWidget.getByRole('button', { name: 'Đang sửa', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'WO-2026-101', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-102', exact: true })).toHaveCount(0);

    await statusWidget.getByRole('button', { name: 'Chờ duyệt', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'WO-2026-102', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-101', exact: true })).toHaveCount(0);

    await statusWidget.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'WO-2026-101', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WO-2026-102', exact: true })).toBeVisible();

    // Right Widget Filters: Lưu lượng xe tiếp nhận
    const intakeWidget = page.locator('div', { hasText: 'Lưu lượng xe tiếp nhận' }).filter({ has: page.getByRole('button', { name: 'Đã nhận' }) }).last();
    await intakeWidget.getByRole('button', { name: 'Đã nhận', exact: true }).click();
    await expect(intakeWidget.getByRole('button', { name: 'Đã nhận', exact: true })).toHaveClass(/bg-\[#0050cd\]/);
    await intakeWidget.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await expect(intakeWidget.getByRole('button', { name: 'Tất cả', exact: true })).toHaveClass(/bg-\[#0050cd\]/);

    // 5. Error (500 graceful fallback) + Retry via reload
    failNextLoad = true;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Chưa có phiếu công việc nào trong nhóm này')).toBeVisible({ timeout: 15000 });

    failNextLoad = false;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('cell', { name: 'WO-2026-101', exact: true })).toBeVisible({ timeout: 15000 });
    expect(woCalls).toBeGreaterThanOrEqual(3);

    // 6. Verify 5 viewports without horizontal overflow
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });

  test('E2E-SA-DASH-01: /advisor/dashboard DashboardFilterBar, scope switcher, no hydration errors & 5 viewports', async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('hydration')) {
        hydrationErrors.push(msg.text());
      }
    });

    const capturedParams: Array<{ period: string | null; scope: string | null }> = [];

    await page.route('**/api/dashboard/sa**', async (route) => {
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
            portal: 'sa',
            period: { key: period || '7days', startDate: '2026-11-01', endDate: '2026-11-16' },
            kpis: [
              { key: 'pendingQuotations', label: 'Báo giá chờ duyệt', value: scope === 'workshop' ? 12 : 4, prevValue: 3, format: 'number' },
              { key: 'inInspectionWos', label: 'Đang kiểm tra xe', value: scope === 'workshop' ? 9 : 3, prevValue: 2, format: 'number' },
              { key: 'qcReadyWos', label: 'Chờ nghiệm thu QC', value: scope === 'workshop' ? 7 : 2, prevValue: 1, format: 'number' },
              { key: 'handoverReadyWos', label: 'Sẵn sàng giao xe', value: scope === 'workshop' ? 5 : 2, prevValue: 2, format: 'number' },
            ],
            charts: {
              distribution: [
                { category: 'IN_PLANNING', count: 4 },
                { category: 'PENDING_APPROVAL', count: 3 },
                { category: 'IN_PROGRESS', count: 6 },
              ],
              appointmentsVolume: 14,
            },
            actionableList: [
              {
                id: 101,
                woNumber: 'WO-2026-101',
                customerName: 'Phạm Hoàng Nam',
                customerPhone: '0918222333',
                vehiclePlate: '51K-888.99',
                vehicleModel: 'Mazda CX-5',
                status: 'PENDING_APPROVAL',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Bảng Điều Hành Cố Vấn Dịch Vụ (Service Advisor)")')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator('text=Báo giá chờ duyệt')).toBeVisible();
    await expect(page.locator('text=WO-2026-101').first()).toBeVisible();
    await expect(page.locator('text=Danh Sách Hồ Sơ Xe (Tôi Phụ Trách)')).toBeVisible();

    // Switch scope to 'workshop'
    await page.getByRole('button', { name: 'Toàn bộ xưởng' }).click();
    await expect(page.locator('text=Danh Sách Hồ Sơ Xe (Toàn Bộ Xưởng)')).toBeVisible({ timeout: 10000 });
    expect(capturedParams.some((p) => p.scope === 'workshop')).toBe(true);

    // Switch period to '30days'
    await page.getByRole('button', { name: '30 ngày' }).click();
    await expect.poll(() => capturedParams.some((p) => p.period === '30days')).toBe(true);

    // Refresh button
    const prevCount = capturedParams.length;
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect.poll(() => capturedParams.length).toBeGreaterThan(prevCount);

    expect(hydrationErrors).toEqual([]);

    // Verify 5 viewports without horizontal overflow
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });
});
