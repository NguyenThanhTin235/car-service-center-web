import { test, expect } from '@playwright/test';

test.describe('E2E Sprint 3: Authentication & RBAC Security Guards', () => {
  test('UC-01 & UC-44 RBAC Guard: Block Customer role from logging into Internal Web portal', async ({ page }) => {
    // Intercept login API call and return CUSTOMER role
    await page.route('**/api/auth/login', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Đăng nhập thành công',
          data: {
            user: {
              id: 1,
              email: 'customer@gmail.com',
              fullName: 'Lê Khách Hàng',
              roles: ['CUSTOMER'],
            },
            token: 'mock-customer-token-1111',
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.goto('http://localhost:3001/login');

    await page.fill('input[name="email"]', 'customer@gmail.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify RBAC security guard displays prompt message and prevents entry
    await expect(
      page.locator('text=Tài khoản này là tài khoản Khách hàng, không có quyền truy cập Cổng Quản trị nội bộ')
    ).toBeVisible();

    // Verify page did NOT redirect into internal dashboard
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('UC-01 Session Guard: Auto-clear previous Customer session if loaded on Internal Web', async ({ page }) => {
    // Inject Customer session into internal web
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'customer@gmail.com',
          fullName: 'Lê Khách Hàng',
          roles: ['CUSTOMER'],
        })
      );
      localStorage.setItem('token', 'mock-customer-token-1111');
    });

    await page.goto('http://localhost:3001/login');

    // Internal portal login page detects non-internal role, dispatches logout, and shows warning
    await expect(
      page.locator('text=Phiên đăng nhập trước là tài khoản Khách hàng')
    ).toBeVisible();
  });
});

