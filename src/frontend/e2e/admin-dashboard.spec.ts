import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  id: 1,
  email: 'admin@autocare.vn',
  fullName: 'Quản Trị Hệ Thống',
  roles: ['ADMIN'],
};

function buildDashboardPayload(period: string) {
  const kpiValues: Record<string, number[]> = {
    today: [52, 48, 18, 14],
    '7days': [55, 50, 20, 48],
    '30days': [64, 58, 22, 186],
    this_month: [60, 54, 21, 142],
  };
  const vals = kpiValues[period] || kpiValues['7days'];

  return {
    success: true,
    data: {
      portal: 'admin',
      period: {
        key: period,
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-13T23:59:59.999Z',
      },
      kpis: [
        { key: 'totalUsers', label: 'Tổng tài khoản IAM', value: vals[0], prevValue: 45, format: 'number' },
        { key: 'activeUsers', label: 'Tài khoản hoạt động', value: vals[1], prevValue: 42, format: 'number', unit: 'người dùng' },
        { key: 'totalEmployees', label: 'Nhân sự kỹ thuật', value: vals[2], format: 'number', unit: 'nhân viên' },
        { key: 'totalServices', label: 'Dịch vụ niêm yết', value: vals[3], format: 'number', unit: 'dịch vụ' },
      ],
      charts: {
        rbacDistribution: [
          { role: 'ADMIN', label: 'Quản trị viên', count: 2 },
          { role: 'MANAGER', label: 'Quản lý xưởng', count: 2 },
          { role: 'TECHNICIAN', label: 'Kỹ thuật viên', count: 16 },
          { role: 'CUSTOMER', label: 'Khách hàng', count: 30 },
        ],
      },
      actionableList: [
        {
          id: 10,
          title: 'Lê Kỹ Thuật',
          subtitle: 'tech.le@autocare.vn',
          status: 'ACTIVE',
          timestamp: '2026-11-10T08:30:00.000Z',
        },
        {
          id: 11,
          title: 'Phạm Cố Vấn',
          subtitle: 'sa.pham@autocare.vn',
          status: 'INACTIVE',
          timestamp: '2026-11-09T10:15:00.000Z',
        },
      ],
    },
  };
}

test.describe('Admin Portal E2E: Admin Dashboard (/admin)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-admin-jwt-token');
    }, ADMIN_USER);
  });

  test('E2E-ADM-DASH-01: Chuyển đổi DashboardFilterBar gọi lại API với query period tương ứng và cập nhật 4 KPICards', async ({
    page,
  }) => {
    const requestedPeriods: string[] = [];

    await page.route('**/api/dashboard/admin**', async (route) => {
      const url = new URL(route.request().url());
      const period = url.searchParams.get('period') || '7days';
      requestedPeriods.push(period);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildDashboardPayload(period)),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/admin', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Tổng quan Hệ thống & Phân quyền IAM")')).toBeVisible({
      timeout: 20000,
    });
    const main = page.getByRole('main');
    await expect(main.getByText('Tổng tài khoản IAM', { exact: true })).toBeVisible();
    await expect(main.getByText('Tài khoản hoạt động', { exact: true })).toBeVisible();
    await expect(main.getByText('Nhân sự kỹ thuật', { exact: true })).toBeVisible();
    await expect(main.getByText('Dịch vụ niêm yết', { exact: true })).toBeVisible();
    expect(requestedPeriods).toContain('7days');

    // Switch to 'today'
    await page.click('button:has-text("Hôm nay")');
    await expect.poll(() => requestedPeriods).toContain('today');

    // Switch to '30days'
    await page.click('button:has-text("30 ngày")');
    await expect.poll(() => requestedPeriods).toContain('30days');

    // Switch to 'this_month'
    await page.click('button:has-text("Tháng này")');
    await expect.poll(() => requestedPeriods).toContain('this_month');
  });

  test('E2E-ADM-DASH-02: Chuyển đổi tabs ALL/ACTIVE/LOCKED trên TelemetryMiniBars và tìm kiếm trên DashboardActionTable', async ({
    page,
  }) => {
    await page.route('**/api/dashboard/admin**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildDashboardPayload('7days')),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/admin', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Lê Kỹ Thuật')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Phạm Cố Vấn')).toBeVisible();

    // Switch Telemetry tabs
    await page.click('button:has-text("Khả dụng")');
    await page.click('button:has-text("Tạm khóa")');
    await page.click('button:has-text("Tất cả")');

    // Search on DashboardActionTable
    const searchInput = page.locator('input[placeholder="Tìm theo tên hoặc email..."]');
    await searchInput.fill('Lê Kỹ Thuật');
    await expect(page.locator('text=Lê Kỹ Thuật')).toBeVisible();
    await expect(page.locator('text=Phạm Cố Vấn')).toBeHidden();
  });

  test('E2E-ADM-DASH-03: Nhấn Chi tiết trên dòng người dùng gọi GET /api/users/:id và hiển thị UserDetailModal', async ({
    page,
  }) => {
    await page.route('**/api/dashboard/admin**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildDashboardPayload('7days')),
      });
    });

    await page.route('**/api/users/10', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: 10,
            email: 'tech.le@autocare.vn',
            fullName: 'Lê Kỹ Thuật',
            phone: '0903334444',
            address: 'Quận 7, TP.HCM',
            isActive: true,
            roles: ['TECHNICIAN'],
            employee: {
              id: 5,
              position: 'TECHNICIAN',
              isActive: true,
              skills: [{ id: 1, name: 'Điện & Chẩn đoán OBD-II' }],
            },
            createdAt: '2026-11-10T08:30:00.000Z',
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/admin', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Lê Kỹ Thuật')).toBeVisible({ timeout: 20000 });
    await page.locator('button:has-text("Chi tiết")').first().click();

    await expect(page.locator('h2:has-text("Chi tiết Tài khoản Người dùng")')).toBeVisible();
    await expect(page.locator('text=USR-0010')).toBeVisible();
    await expect(page.locator('text=Thông tin Nhân sự Kỹ thuật')).toBeVisible();
    await expect(page.locator('text=Điện & Chẩn đoán OBD-II')).toBeVisible();

    const accountsLink = page.locator('a:has-text("Mở trong Quản lý Tài khoản")');
    await expect(accountsLink).toHaveAttribute(
      'href',
      '/accounts?search=tech.le%40autocare.vn'
    );

    await page.click('button:has-text("Đóng")');
    await expect(page.locator('h2:has-text("Chi tiết Tài khoản Người dùng")')).toBeHidden();
  });

  test('E2E-ADM-DASH-04: Xử lý Empty State và Error State (API 500) không gây crash trang', async ({
    page,
  }) => {
    // 1. Empty State
    await page.route('**/api/dashboard/admin**', async (route) => {
      const payload = buildDashboardPayload('7days');
      payload.data.actionableList = [];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/admin', { waitUntil: 'domcontentloaded' });

    await expect(
      page.locator('text=Không có tài khoản nào được tạo trong thời gian này')
    ).toBeVisible({ timeout: 20000 });

    // 2. Error State (API 500)
    await page.unroute('**/api/dashboard/admin**');
    await page.route('**/api/dashboard/admin**', async (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
      });
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Tổng quan Hệ thống & Phân quyền IAM")')).toBeVisible({
      timeout: 20000,
    });
  });
});
