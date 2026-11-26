import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  MOCK_CUSTOMER_USER,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer Portal — Profile, Vehicles CRUD & 3-Step Booking', () => {
  test('UC-01 & UC-02: Login redirects customer to /home cleanly', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/auth/login', async (route) => {
      const requestData = JSON.parse(route.request().postData() || '{}');
      if (requestData.email === 'invalid@customer.com' || requestData.password === 'wrongpass') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            code: 401,
            message: 'Email hoặc mật khẩu không chính xác.',
            timestamp: Date.now(),
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Đăng nhập thành công',
          data: {
            user: { ...MOCK_CUSTOMER_USER, email: requestData.email || MOCK_CUSTOMER_USER.email },
            token: 'mock-customer-jwt-token-12345',
            refreshToken: 'mock-customer-refresh-token',
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/login`);
    await expect(page.locator('h1')).toContainText('Đăng nhập');

    // Invalid login
    await page.fill('input[name="email"]', 'invalid@customer.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Email hoặc mật khẩu không chính xác.')).toBeVisible();

    // Valid customer login redirects to /home per roleRedirect.ts
    await page.fill('input[name="email"]', MOCK_CUSTOMER_USER.email);
    await page.fill('input[name="password"]', 'Secret123@');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('Overview & Profile tabs: displays KPIs and updates customer profile via ConfirmModal', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=overview`);

    // Overview Tab assertions
    await expect(
      page.getByRole('heading', { level: 1, name: MOCK_CUSTOMER_USER.fullName })
    ).toBeVisible();
    await expect(page.getByText('51A-999.99').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Xe đang sở hữu')).toBeVisible();

    // Switch to Profile tab
    await page.getByRole('button', { name: /Hồ sơ cá nhân/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();

    // Enter edit mode
    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();

    const phoneInput = page.getByPlaceholder('Nhập số điện thoại (VD: 0901234567)');
    await phoneInput.fill('12345');
    await expect(page.getByText(/Số điện thoại không đúng định dạng/i)).toBeVisible();

    await phoneInput.fill('0909888777');
    await page.getByPlaceholder('Nhập họ và tên').fill('Nguyễn Văn Khách Updated');

    await page.getByRole('button', { name: /Lưu thay đổi/i }).click();
    // ConfirmModal
    await expect(page.getByText('Bạn có chắc chắn muốn lưu thông tin hồ sơ đã thay đổi không?')).toBeVisible();
    await page.getByRole('button', { name: /Lưu$/ }).last().click();

    await expect(page.getByText('Cập nhật hồ sơ thành công!')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('UC-03 Vehicles CRUD: redirect, validation, create, edit, soft-deactivate and restore', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/vehicles`);
    await expect(page).toHaveURL(/\/customer\/profile\?tab=vehicles/, { timeout: 10000 });

    await expect(page.getByText('51A-999.99').first()).toBeVisible();
    await expect(page.getByText('30E-888.88').first()).toBeVisible();

    // Add vehicle with plate validation check first
    await page.getByRole('button', { name: /Thêm xe mới/i }).click();
    await page.getByPlaceholder('Ví dụ: 51G-123.45').fill('INVALID');
    await page.getByPlaceholder('Toyota, Honda, Ford...').fill('Mazda');
    await page.getByPlaceholder('Santa Fe, Everest, Vios...').fill('CX-5');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(/Biển số xe không đúng định dạng/i)).toBeVisible();

    // Fix plate and save
    await page.getByPlaceholder('Ví dụ: 51G-123.45').fill('51K-678.90');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('Thêm phương tiện mới thành công!')).toBeVisible();
    await expect(page.getByText('51K-678.90').first()).toBeVisible();

    // Soft-deactivate vehicle with transactions (51A-999.99) then restore it
    await page.getByRole('button', { name: /Vô hiệu hóa/i }).first().click();
    await expect(page.getByText(/Xác nhận vô hiệu hóa xe/i)).toBeVisible();
    await page.getByRole('button', { name: /Xác nhận$/ }).last().click();
    await expect(page.getByRole('button', { name: /Kích hoạt lại/i })).toBeVisible();

    await page.getByRole('button', { name: /Kích hoạt lại/i }).click();
    await expect(page.getByText(/Kích hoạt lại.*thành công/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Vô hiệu hóa/i }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('UC-04 Lazy CustomerBookingModal (3-step) + Reschedule & Cancel existing appointment', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=appointments`);
    await expect(page.getByRole('heading', { name: 'Lịch hẹn dịch vụ' })).toBeVisible();

    // Click existing REQUESTED appointment on calendar
    await page.getByText(/09:00 • 51A-999\.99/).click();
    await expect(page.getByText('Chi tiết lịch hẹn #501')).toBeVisible();

    // Reschedule appointment
    await page.getByRole('button', { name: 'Dời ngày/giờ' }).click();
    await expect(page.getByText('Dời lịch hẹn #501')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận dời lịch' }).click();
    await expect(page.getByText('Dời lịch hẹn thành công!')).toBeVisible();

    // Open Appointment detail again and cancel
    await page.getByText(/09:00 • 51A-999\.99/).click();
    await page.getByRole('button', { name: 'Hủy lịch' }).click();
    await page.getByPlaceholder('Tôi bận việc đột xuất...').fill('Thay đổi kế hoạch di chuyển');
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByText('Đã hủy lịch hẹn thành công.')).toBeVisible();

    // Open lazy 3-Step CustomerBookingModal
    await page.getByRole('button', { name: 'Đặt lịch mới' }).click();
    await expect(page.getByText('Đặt lịch dịch vụ & sửa chữa')).toBeVisible({ timeout: 15000 });

    // Step 1: Vehicle already selected -> Next
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Step 2: Add notes -> Next
    await page
      .getByPlaceholder('Nhập mô tả tình trạng xe của bạn (nếu có)...')
      .fill('Kiểm tra hệ thống điều hòa trước chuyến đi');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Step 3: Advance to next month so day 15 is always strictly in the future and free
    await page.getByRole('button', { name: '›' }).click();
    await page.getByRole('button', { name: '15', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu lịch hẹn' }).click();

    await expect(page.getByText(/Đặt lịch dịch vụ thành công!/i)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('UC-04 Standalone /customer/appointments/new 3-Step Wizard flow', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/appointments/new`);

    await expect(page).toHaveURL(/.*\/customer\/profile\?.*tab=appointments/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Đặt lịch dịch vụ & sửa chữa' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Chọn xe cần làm dịch vụ')).toBeVisible();

    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(
      page.getByPlaceholder('Nhập mô tả tình trạng xe của bạn (nếu có)...')
    ).toBeVisible();

    await page
      .getByPlaceholder('Nhập mô tả tình trạng xe của bạn (nếu có)...')
      .fill('Xe có tiếng kêu nhẹ khi khởi động vào buổi sáng');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    await page.getByRole('button', { name: '›' }).click();
    await page.getByRole('button', { name: '15', exact: true }).click();
    const appointmentPost = page.waitForResponse(
      (res) => res.url().includes('/api/appointments') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Lưu lịch hẹn' }).click();
    const postRes = await appointmentPost;
    expect(postRes.status()).toBe(201);

    await expect(page.getByText(/Đặt lịch dịch vụ thành công!/i)).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });
});
