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

function makeWorkOrder(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    wo_number: `WO-2026-${String(id).padStart(3, '0')}`,
    status: 'IN_PROGRESS',
    source_type: 'WALK_IN',
    created_at: new Date().toISOString(),
    customer: { id, full_name: `Khách Hàng ${id}`, phone: `0909000${String(id).padStart(3, '0')}`, email: `kh${id}@gmail.com` },
    vehicle: {
      id: id + 100,
      license_plate: `51K-${String(100 + id)}.99`,
      make: 'Mazda',
      model: 'CX-5',
      year: 2022,
      color: 'Xanh',
      vehicle_size: 'MEDIUM',
    },
    advisor: { id: 2, full_name: 'Trần Cố Vấn' },
    ...overrides,
  };
}

const ALL_WORK_ORDERS = [
  makeWorkOrder(101, {
    wo_number: 'WO-2026-101',
    status: 'IN_PROGRESS',
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', year: 2022, color: 'Xanh', vehicle_size: 'MEDIUM' },
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
  }),
  makeWorkOrder(102, {
    wo_number: 'WO-2026-102',
    status: 'IN_PLANNING',
    vehicle: { id: 11, license_plate: '30H-456.78', make: 'Toyota', model: 'Camry', year: 2021, color: 'Đen', vehicle_size: 'MEDIUM' },
    customer: { id: 2, full_name: 'Nguyễn Thị Hoa', phone: '0909444555', email: 'hoa@gmail.com' },
  }),
  makeWorkOrder(103, {
    wo_number: 'WO-2026-103',
    status: 'BILLING_REQUESTED',
    vehicle: { id: 12, license_plate: '51G-123.45', make: 'Honda', model: 'CR-V', year: 2023, color: 'Trắng', vehicle_size: 'LARGE' },
    customer: { id: 3, full_name: 'Lê Minh Tuấn', phone: '0919666777', email: 'tuan@gmail.com' },
  }),
  ...Array.from({ length: 12 }, (_, idx) => makeWorkOrder(104 + idx)),
];

test.describe('Service Advisor Portal E2E: Work Orders List (/advisor/work-orders)', () => {
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

  test('E2E-SA-WO-01: ?search= URL sync, status pill & dropdown filters, và TablePagination', async ({
    page,
  }) => {
    const capturedQueries: Array<{ search: string | null; status: string | null; page: string | null }> = [];

    await page.route('**/api/work-orders**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      const pageNum = Number(url.searchParams.get('page') || '1');
      const limit = Number(url.searchParams.get('limit') || '10');

      capturedQueries.push({ search, status, page: String(pageNum) });

      let filtered = [...ALL_WORK_ORDERS];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.wo_number.toLowerCase().includes(q) ||
            w.vehicle.license_plate.toLowerCase().includes(q) ||
            w.customer.full_name.toLowerCase().includes(q)
        );
      }
      if (status) {
        filtered = filtered.filter((w) => w.status === status);
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (pageNum - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: paged,
          meta: {
            pagination: {
              total,
              totalPages,
              currentPage: pageNum,
              perPage: limit,
            },
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/work-orders?search=51K-888', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('h1:has-text("Phiếu công việc")')).toBeVisible({ timeout: 20000 });
    const searchInput = page.locator('input[placeholder="Tìm theo mã phiếu (RO), biển số xe, tên khách..."]');
    await expect(searchInput).toHaveValue('51K-888');
    await expect(page.locator('text=WO-2026-101').first()).toBeVisible();
    await expect(page.locator('text=WO-2026-102')).toHaveCount(0);
    expect(capturedQueries.some((q) => q.search === '51K-888')).toBe(true);

    // Clear search
    await page.locator('button[title="Xóa tìm kiếm"]').click();
    await expect(page.locator('text=WO-2026-102').first()).toBeVisible({ timeout: 10000 });

    // Status pill filter: Kế hoạch (IN_PLANNING)
    await page.getByRole('button', { name: 'Kế hoạch', exact: true }).click();
    await expect(page.locator('text=WO-2026-102').first()).toBeVisible();
    await expect(page.locator('text=WO-2026-101')).toHaveCount(0);
    expect(capturedQueries.some((q) => q.status === 'IN_PLANNING')).toBe(true);

    // Status dropdown filter: Chờ thanh toán (BILLING_REQUESTED)
    const statusSelect = page.locator('select[aria-label="Lọc trạng thái phiếu công việc"]');
    await statusSelect.selectOption('BILLING_REQUESTED');
    await expect(page.locator('text=WO-2026-103').first()).toBeVisible();
    await expect(page.locator('text=WO-2026-102')).toHaveCount(0);
    expect(capturedQueries.some((q) => q.status === 'BILLING_REQUESTED')).toBe(true);

    // Reset to ALL and test TablePagination (15 items -> 2 pages)
    await statusSelect.selectOption('ALL');
    await expect(page.locator('text=WO-2026-101').first()).toBeVisible();

    // Go to page 2
    await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
    await expect(page.locator('text=WO-2026-111').first()).toBeVisible({ timeout: 10000 });
    expect(capturedQueries.some((q) => q.page === '2')).toBe(true);
  });

  test('E2E-SA-WO-02: Empty state, Error toast + Retry via Làm mới, và 5 viewports', async ({
    page,
  }) => {
    let woCalls = 0;
    await page.route('**/api/work-orders**', async (route) => {
      woCalls += 1;
      if (woCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Server error' }),
        });
      }
      if (woCalls === 2) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            meta: { pagination: { total: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [ALL_WORK_ORDERS[0]],
          meta: { pagination: { total: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/work-orders', { waitUntil: 'domcontentloaded' });

    // Call 1: 500 error toast
    await expect(page.locator('text=Lỗi tải danh sách phiếu công việc').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Không có phiếu công việc nào')).toBeVisible();

    // Call 2: Retry -> Empty state
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect(page.locator('text=Không có phiếu công việc nào')).toBeVisible({ timeout: 10000 });

    // Call 3: Retry -> Data loaded
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect(page.locator('text=WO-2026-101').first()).toBeVisible({ timeout: 10000 });
    expect(woCalls).toBeGreaterThanOrEqual(3);

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
