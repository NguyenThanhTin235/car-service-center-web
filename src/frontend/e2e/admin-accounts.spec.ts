import { test, expect } from '@playwright/test';

const CURRENT_ADMIN = {
  id: 1,
  email: 'admin@autocare.vn',
  fullName: 'Quản Trị Hệ Thống',
  roles: ['ADMIN'],
};

const INITIAL_USERS = [
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
    address: 'Quận 1, TP.HCM',
    isActive: true,
    roles: ['ADVISOR'],
    employee: { id: 2, position: 'ADVISOR' },
  },
  {
    id: 3,
    email: 'tech.locked@autocare.vn',
    fullName: 'Nguyễn Kỹ Thuật',
    phone: '0903000777',
    address: 'Quận 7, TP.HCM',
    isActive: false,
    roles: ['TECHNICIAN'],
    employee: { id: 3, position: 'TECHNICIAN' },
  },
];

test.describe('Admin Portal E2E: IAM Accounts (/accounts)', () => {
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
    }, CURRENT_ADMIN);
  });

  test('E2E-ADM-USR-01: Lọc theo search input, URL ?search=, role pills, status dropdown và phân trang', async ({
    page,
  }) => {
    const capturedQueries: Array<{ search: string; role: string; status: string; page: string }> = [];

    await page.route('**/api/users**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search') || '';
      const role = url.searchParams.get('role') || '';
      const status = url.searchParams.get('status') || '';
      const pageParam = url.searchParams.get('page') || '1';
      capturedQueries.push({ search, role, status, page: pageParam });

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_USERS,
          pagination: {
            totalRecords: 15,
            totalPages: 2,
            currentPage: Number(pageParam),
            limit: 10,
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/accounts?search=advisor', {
      waitUntil: 'domcontentloaded',
    });

    const searchInput = page.locator('input[placeholder="Tìm theo Họ tên, Email, SĐT..."]');
    await expect(searchInput).toHaveValue('advisor', { timeout: 20000 });
    await expect.poll(() => capturedQueries.some((q) => q.search === 'advisor')).toBe(true);

    // Filter by role pill
    await page.locator('button:has-text("Cố vấn dịch vụ")').first().click();
    await expect.poll(() => capturedQueries.some((q) => q.role === 'ADVISOR')).toBe(true);

    // Filter by status dropdown
    await page.locator('select').nth(1).selectOption('active');
    await expect.poll(() => capturedQueries.some((q) => q.status === 'active')).toBe(true);

    // Pagination page 2
    await page.locator('button', { hasText: /^2$/ }).click();
    await expect.poll(() => capturedQueries.some((q) => q.page === '2')).toBe(true);
  });

  test('E2E-ADM-USR-02: Tạo tài khoản mới và chỉnh sửa tài khoản (email bị disabled)', async ({
    page,
  }) => {
    let createdPayload: any = null;
    let updatedPayload: any = null;

    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Tạo tài khoản thành công',
            data: {
              id: 20,
              ...createdPayload,
              isActive: true,
              roles: [createdPayload.role],
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_USERS,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.route('**/api/users?**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_USERS,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.route('**/api/users/2', async (route) => {
      if (route.request().method() === 'PUT') {
        updatedPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Cập nhật tài khoản thành công',
            data: { id: 2, ...updatedPayload },
          }),
        });
      }
      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/accounts', { waitUntil: 'domcontentloaded' });

    // 1. Create account
    await page.click('button:has-text("Thêm tài khoản mới")');
    await expect(page.locator('h2:has-text("Thêm tài khoản mới")')).toBeVisible();

    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Lê Văn Mới');
    await page.fill('input[placeholder="email@company.com"]', 'levanmoi@autocare.vn');
    await page.fill('input[name="account_new_password"]', 'secret123');
    await page.fill('input[placeholder="0901234567"]', '0908111222');
    await page.fill('input[placeholder="Số nhà, đường, quận, thành phố"]', '123 Lê Lợi, Q1');
    await page.click('button:has-text("Xác nhận tạo")');

    await expect.poll(() => createdPayload).not.toBeNull();
    expect(createdPayload).toMatchObject({
      email: 'levanmoi@autocare.vn',
      fullName: 'Lê Văn Mới',
      phone: '0908111222',
      role: 'ADVISOR',
    });

    // 2. Edit account (index 1 -> Trần Cố Vấn, id=2)
    await page.locator('button[title="Chỉnh sửa"]').nth(1).click();
    await expect(page.locator('h2:has-text("Cập nhật tài khoản")')).toBeVisible();
    await expect(page.locator('input[placeholder="email@company.com"]')).toBeDisabled();

    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Trần Cố Vấn Pro');
    await page.click('button:has-text("Lưu thay đổi")');

    await expect.poll(() => updatedPayload).not.toBeNull();
    expect(updatedPayload.fullName).toBe('Trần Cố Vấn Pro');
  });

  test('E2E-ADM-USR-03: Đổi mật khẩu qua Reset Password modal (validate >= 6 ký tự)', async ({
    page,
  }) => {
    let resetPayload: any = null;

    await page.route('**/api/users**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_USERS,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.route('**/api/users/2/reset-password', async (route) => {
      resetPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Đặt lại mật khẩu thành công' }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/accounts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Trần Cố Vấn')).toBeVisible({ timeout: 20000 });
    await page.locator('button[title="Đặt lại mật khẩu"]').nth(1).click();

    const pwInput = page.locator('#reset-account-new-password');
    await expect(pwInput).toBeVisible();

    // Invalid short password (< 6)
    await pwInput.fill('123');
    await page.click('button:has-text("Xác nhận đổi")');
    expect(resetPayload).toBeNull();
    await expect(page.locator('text=Mật khẩu mới phải có ít nhất 6 ký tự.')).toBeVisible();

    // Valid password (>= 6)
    await pwInput.fill('newpass123');
    await page.click('button:has-text("Xác nhận đổi")');
    await expect.poll(() => resetPayload).toEqual({ newPassword: 'newpass123' });
  });

  test('E2E-ADM-USR-04: Toggle khóa/mở khóa tài khoản và chặn tự khóa chính mình (isCurrentUser)', async ({
    page,
  }) => {
    let deactivatedId: number | null = null;
    let reactivatedId: number | null = null;

    await page.route('**/api/users**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_USERS,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.route('**/api/users/2', async (route) => {
      if (route.request().method() === 'DELETE') {
        deactivatedId = 2;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    await page.route('**/api/users/3/reactivate', async (route) => {
      if (route.request().method() === 'PATCH') {
        reactivatedId = 3;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', message: 'Khôi phục tài khoản thành công' }),
        });
      }
      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/accounts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('tbody').getByText('Quản Trị Hệ Thống')).toBeVisible({ timeout: 20000 });

    // 1. Self-deactivation guard: clicking switch on row 0 (current admin) should NOT open modal
    const switches = page.locator('button[role="switch"]');
    await switches.nth(0).click();
    await expect(page.locator('h3:has-text("Khóa tài khoản")')).toBeHidden();

    // 2. Deactivate user 2 (Trần Cố Vấn)
    await switches.nth(1).click();
    await expect(page.locator('h3:has-text("Khóa tài khoản")')).toBeVisible();
    await page.click('button:has-text("Xác nhận khóa")');
    await expect.poll(() => deactivatedId).toBe(2);

    // 3. Reactivate user 3 (Nguyễn Kỹ Thuật - currently inactive)
    await switches.nth(2).click();
    await expect(page.locator('h3:has-text("Mở khóa tài khoản")')).toBeVisible();
    await page.click('button:has-text("Xác nhận mở khóa")');
    await expect.poll(() => reactivatedId).toBe(3);
  });
});
