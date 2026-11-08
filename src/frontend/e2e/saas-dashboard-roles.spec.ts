import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

test.describe('SaaS Dashboard Redesign E2E: Staff, Manager & Admin Roles', () => {
  test.beforeEach(async ({ page }) => {
    // Default fallback for any unintercepted API calls
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 },
          meta: { pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
          timestamp: Date.now(),
        }),
      });
    });

    // Mock intake queue for Staff
    await page.route('**/api/intake**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
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
            },
          ],
        }),
      });
    });

    // Mock appointments for Staff
    await page.route('**/api/appointments**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 301,
              customer_id: 2,
              vehicle_id: 12,
              scheduled_date: '2026-11-07',
              scheduled_time: '09:30',
              scheduled_time_str: '09:30',
              status: 'CONFIRMED',
              customer: { id: 2, full_name: 'Lê Minh Tuấn', phone: '0909111222' },
              vehicle: { id: 12, license_plate: '30H-123.45', make: 'Toyota', model: 'Camry' },
            },
          ],
          pagination: { page: 1, limit: 50, total: 1 },
        }),
      });
    });

    // Mock billing queue for Staff
    await page.route('**/api/invoices/billing-queue**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            summary: {
              pendingCount: 2,
              draftCount: 1,
              issuedCount: 1,
              paidTodayCount: 8,
              paidTodayRevenue: 24500000,
            },
            records: [],
            pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 10 },
          },
        }),
      });
    });

    // Mock workshop dashboard for Manager (UC-43)
    await page.route('**/api/dashboard/workshop**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            kpis: {
              totalActive: 6,
              pendingApproval: 2,
              billingRequested: 1,
              overdueJobs: 1,
            },
            workOrders: [
              {
                id: 501,
                woNumber: 'WO-2026-501',
                status: 'IN_PROGRESS',
                customerName: 'Nguyễn Minh Quân',
                vehiclePlate: '51G-777.66',
                vehicleInfo: 'Hyundai SantaFe 2023',
                advisorName: 'Trần Cố Vấn',
                createdAt: new Date().toISOString(),
                services: [
                  {
                    id: 1,
                    name: 'Bảo dưỡng phanh & Gầm',
                    status: 'IN_PROGRESS',
                    jobs: [
                      {
                        id: 11,
                        name: 'Thay má phanh trước',
                        status: 'IN_PROGRESS',
                        isOverdue: false,
                        startedAt: new Date().toISOString(),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      });
    });

    // Mock users IAM list for Admin
    await page.route('**/api/users**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              email: 'admin@autocare.vn',
              fullName: 'Quản Trị Hệ Thống',
              phone: '0901000999',
              address: 'TP.HCM',
              isActive: true,
              roles: ['ADMIN'],
              employee: { id: 1, position: 'ADMIN' },
            },
            {
              id: 2,
              email: 'advisor@autocare.vn',
              fullName: 'Trần Cố Vấn',
              phone: '0902000888',
              address: 'TP.HCM',
              isActive: true,
              roles: ['ADVISOR'],
              employee: { id: 2, position: 'ADVISOR' },
            },
          ],
          pagination: {
            totalRecords: 2,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
          },
        }),
      });
    });
  });

  test('1. Staff Dashboard (/staff): SaaS Shell, Bento Grid, Wave Chart, Collapse & 4-Viewport Audit', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 4,
          email: 'staff@autocare.vn',
          fullName: 'Lễ Tân Lan',
          roles: ['DESK STAFF'],
        })
      );
      localStorage.setItem('token', 'mock-staff-jwt-token');
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff', { waitUntil: 'domcontentloaded' });

    // Verify SaaS Shell & Bento Components
    await expect(page.getByTestId('saas-sidebar')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('saas-sidebar-search')).toBeVisible();
    await expect(page.getByTestId('saas-sidebar-telemetry')).toBeVisible();
    await expect(page.getByTestId('staff-bento-grid')).toBeVisible();
    await expect(page.getByTestId('staff-wave-chart')).toBeVisible();
    await expect(page.getByTestId('staff-live-queue-table')).toBeVisible();

    // Verify live vehicle data in queue table & legacy static placeholders removed
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();
    await expect(page.locator('text=24/05/2024')).toHaveCount(0);
    await expect(page.locator('text=Danh sách chờ xử lý sẽ hiển thị ở đây')).toHaveCount(0);

    // Test Sidebar Collapse & Expand on Desktop
    await page.getByTestId('saas-sidebar-collapse-btn').click();
    await expect(page.getByTestId('saas-sidebar-expand-btn')).toBeVisible();
    await page.getByTestId('saas-sidebar-expand-btn').click();

    // Verify 4 Viewports & Mobile Drawer
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(
        hasOverflow,
        `Staff Dashboard viewport ${vp.name} (${vp.width}x${vp.height}) should have zero horizontal overflow`
      ).toBe(false);
    }

    // On mobile (390px), open and verify slide-over drawer
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('saas-mobile-menu-btn').click();
    await expect(page.getByTestId('saas-mobile-drawer')).toBeVisible();
  });

  test('2. Manager Dashboard (/dashboard): Blue SaaS Bento, Wave Chart, View Toggle & 4-Viewport Audit', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 5,
          email: 'manager@autocare.vn',
          fullName: 'Lê Quản Lý',
          roles: ['MANAGER'],
        })
      );
      localStorage.setItem('token', 'mock-manager-jwt-token');
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('saas-sidebar')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('manager-bento-grid')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('manager-wave-chart')).toBeVisible();
    await expect(page.locator('text=WO-2026-501').first()).toBeVisible();

    // Switch between Bento Cards and High-Density Table view
    await page.click('button:has-text("Bảng mật độ cao")');
    await expect(page.locator('th:has-text("Mã Lệnh (RO)")')).toBeVisible();
    await page.click('button:has-text("Thẻ Bento")');

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(
        hasOverflow,
        `Manager Dashboard viewport ${vp.name} (${vp.width}x${vp.height}) should have zero horizontal overflow`
      ).toBe(false);
    }
  });

  test('3. Admin Dashboard (/accounts): IAM Bento Hero, Wave Chart, Modal & 4-Viewport Audit', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'admin@autocare.vn',
          fullName: 'Quản Trị Hệ Thống',
          roles: ['ADMIN'],
        })
      );
      localStorage.setItem('token', 'mock-admin-jwt-token');
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/accounts', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('saas-sidebar')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('admin-bento-grid')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('admin-wave-chart')).toBeVisible();
    await expect(page.locator('text=USR-0001')).toBeVisible();

    // Open Create Account Modal and close it
    await page.click('button:has-text("Cấp tài khoản mới")');
    await expect(page.locator('h2:has-text("Cấp tài khoản mới")')).toBeVisible();
    await page.click('button:has-text("Hủy thao tác")');

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(
        hasOverflow,
        `Admin Accounts viewport ${vp.name} (${vp.width}x${vp.height}) should have zero horizontal overflow`
      ).toBe(false);
    }
  });

  test('4. Redesigned Sub-Pages & Harmonic Sidebar Tone Switcher Audit (Staff, Manager, Admin)', async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'admin@autocare.vn',
          fullName: 'Quản Trị Hệ Thống',
          roles: ['ADMIN', 'MANAGER', 'DESK STAFF'],
        })
      );
      localStorage.setItem('token', 'mock-super-jwt-token');
    });

    await page.setViewportSize({ width: 1440, height: 900 });

    const subPages = [
      { path: '/staff/appointments', heading: 'Lịch hẹn khách hàng' },
      { path: '/staff/intake', heading: 'Tiếp nhận xe vào xưởng' },
      { path: '/staff/billing', heading: 'Hóa đơn & Thu ngân' },
      { path: '/staff/customers', heading: 'Khách hàng & Phương tiện' },
      { path: '/inventory', heading: 'Quản lý kho phụ tùng' },
      { path: '/part-categories', heading: 'Danh mục phụ tùng' },
      { path: '/employees', heading: 'Quản lý Nhân viên' },
      { path: '/services', heading: 'Danh sách Dịch vụ' },
      { path: '/service-categories', heading: 'Danh mục Dịch vụ' },
      { path: '/job-types', heading: 'Loại công việc' },
      { path: '/catalogs', heading: 'Danh mục chung' },
    ];

    for (const sp of subPages) {
      await page.goto(`http://localhost:3001${sp.path}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('saas-sidebar')).toBeVisible({ timeout: 20000 });
      await expect(page.locator(`h1:has-text("${sp.heading}")`)).toBeVisible({ timeout: 20000 });

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(hasOverflow, `Sub-page ${sp.path} should have zero horizontal overflow`).toBe(false);
    }

    // Verify Sidebar Tone Toggle (Sapphire Dark <-> Soft Light Slate)
    const toneToggle = page.getByTestId('saas-sidebar-tone-toggle');
    await expect(toneToggle).toBeVisible();
    await toneToggle.click();
    await expect(toneToggle).toContainText('Sidebar Sáng');
    await toneToggle.click();
    await expect(toneToggle).toContainText('Sidebar Sapphire');
  });
});

