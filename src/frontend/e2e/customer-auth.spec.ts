import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  MOCK_CUSTOMER_USER,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer Portal — Authentication, OTP & Session Guards', () => {
  test('Login: banners, 401 error, 429 lockout countdown, and successful redirect to /home', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/auth/login', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.email === 'locked@customer.com') {
        return route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần.',
            retryAfter: 120,
          }),
        });
      }
      if (body.password === 'wrongpass') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Email hoặc mật khẩu không chính xác.',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { ...MOCK_CUSTOMER_USER, email: body.email },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
          },
        }),
      });
    });

    // Query banner check (?registered=true)
    await page.goto(`${CUSTOMER_BASE_URL}/login?registered=true`);
    await expect(page.getByText('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')).toBeVisible();

    // 401 wrong credentials
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Email hoặc mật khẩu không chính xác.')).toBeVisible();

    // 429 lockout countdown
    await page.fill('input[name="email"]', 'locked@customer.com');
    await page.fill('input[name="password"]', 'anypass');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('button', { name: 'Tạm khóa đăng nhập' })).toBeDisabled();
    await expect(page.getByText(/01:5\d|02:00/)).toBeVisible();

    // Valid login redirects to /home
    await page.goto(`${CUSTOMER_BASE_URL}/login?reset=true`);
    await expect(
      page.getByText('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.')
    ).toBeVisible();
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Secret123@');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('Register + Verify OTP flow completes signup and redirects to /home', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/auth/send-otp-register', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'OTP sent' }),
      });
    });

    await page.route('**/api/auth/verify-otp-register', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Đăng ký tài khoản thành công! Chào mừng bạn đến với AutoCare Pro.',
          data: {
            user: MOCK_CUSTOMER_USER,
            token: 'mock-new-token',
            refreshToken: 'mock-new-refresh',
          },
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/register`);

    // Client validation checks
    await page.fill('input[name="fullName"]', 'Nguyen 123!');
    await page.fill('input[name="phone"]', '0901234567');
    await page.fill('input[name="email"]', 'newcustomer@example.com');
    await page.fill('input[name="password"]', 'Secret123@');
    await page.fill('input[name="confirmPassword"]', 'Mismatch123@');
    await page.click('#btn-register');
    await expect(
      page.getByText('Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.')
    ).toBeVisible();

    await page.fill('input[name="fullName"]', 'Nguyễn Văn Mới');
    await page.click('#btn-register');
    await expect(page.getByText('Mật khẩu xác nhận không khớp.')).toBeVisible();

    // Valid registration submission
    await page.fill('input[name="confirmPassword"]', 'Secret123@');
    await page.click('#btn-register');

    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10000 });
    await expect(page.getByText('newcustomer@example.com')).toBeVisible();

    // Enter 6-digit OTP
    for (let i = 1; i <= 6; i++) {
      await page.getByLabel(`Mã OTP chữ số thứ ${i}`).fill(String(i));
    }
    await page.click('#btn-verify-otp');

    await expect(page.getByText(/Đăng ký tài khoản thành công!/i)).toBeVisible();
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('Forgot Password -> Verify OTP -> Reset Password complete flow', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'OTP sent' }),
      })
    );
    await page.route('**/api/auth/verify-otp-reset', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Verified' }),
      })
    );
    await page.route('**/api/auth/reset-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password reset' }),
      })
    );

    await page.goto(`${CUSTOMER_BASE_URL}/forgot-password`);
    await page.fill('#forgot-email', 'customer@example.com');
    await page.click('#btn-forgot-submit');

    await expect(page.locator('#btn-go-to-otp')).toBeVisible();
    await page.click('#btn-go-to-otp');

    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10000 });
    for (let i = 1; i <= 6; i++) {
      await page.getByLabel(`Mã OTP chữ số thứ ${i}`).fill('6');
    }
    await page.click('#btn-verify-otp');

    await expect(page).toHaveURL(/\/reset-password/, { timeout: 10000 });
    await page.fill('#newPassword', 'NewSecret123!');
    await page.fill('#confirmPassword', 'NewSecret123!');
    await page.click('#btn-reset-submit');

    await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu thành công' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Đăng nhập ngay/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('AuthGuard redirects unauthenticated users and SessionWatcher logs out on 401 heartbeat', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    const mockState = await setupCustomerApiMocks(page);

    // 1. Unauthenticated access to /customer/profile redirects to /login
    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 2. Seed session once in localStorage while on /login (avoid addInitScript re-seeding after logout reload)
    await page.evaluate((u) => {
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', 'mock-customer-jwt-token');
      localStorage.setItem('refreshToken', 'mock-customer-refresh-token');
    }, MOCK_CUSTOMER_USER);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=overview`);
    await expect(page.getByRole('heading', { level: 1, name: MOCK_CUSTOMER_USER.fullName })).toBeVisible();

    // Simulate backend token revocation / account lock on next SessionWatcher poll
    mockState.authMeStatus = 401;
    await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 10000 });
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    expect(pageErrors).toEqual([]);
  });
});
