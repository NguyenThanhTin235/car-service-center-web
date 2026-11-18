import { test, expect } from '@playwright/test';

test.describe('E2E Sprint 3: Customer Portal Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept common APIs to ensure fully deterministic and hermetic test runs
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
            user: {
              id: 1,
              email: requestData.email || 'customer@example.com',
              fullName: 'Nguyễn Văn Khách',
              roles: ['CUSTOMER'],
            },
            token: 'mock-customer-jwt-token-12345',
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/auth/me**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            id: 1,
            fullName: 'Nguyễn Văn Khách',
            phone: '0901234567',
            email: 'customer@example.com',
            address: '77 Nguyễn Huệ, Quận 1, TP.HCM',
            roles: ['CUSTOMER'],
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/vehicles**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Lấy danh sách xe thành công',
          data: [
            {
              id: 10,
              licensePlate: '51A-999.99',
              make: 'Honda',
              model: 'CR-V',
              year: 2022,
              color: 'Trắng',
              vehicleSize: 'LARGE',
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 11,
              licensePlate: '30E-888.88',
              make: 'Toyota',
              model: 'Camry',
              year: 2021,
              color: 'Đen',
              vehicleSize: 'LARGE',
              isActive: true,
              createdAt: '2026-01-05T00:00:00.000Z',
            },
          ],
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/services**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Lấy danh mục dịch vụ thành công',
          data: [
            {
              id: 1,
              name: 'Bảo dưỡng định kỳ 10.000km',
              description: 'Kiểm tra 48 hạng mục tiêu chuẩn',
              isActive: true,
            },
            {
              id: 2,
              name: 'Thay dầu động cơ và lọc dầu',
              description: 'Dầu tổng hợp toàn phần và lọc chính hãng',
              isActive: true,
            },
            {
              id: 3,
              name: 'Kiểm tra hệ thống điều hòa',
              description: 'Nội soi giàn lạnh và nạp bổ sung gas',
              isActive: true,
            },
          ],
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/appointments**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            code: 201,
            message: 'Đặt lịch hẹn thành công',
            data: {
              id: 999,
              customer_id: 1,
              vehicle_id: body.vehicle_id,
              scheduled_date: body.scheduled_date,
              scheduled_time: body.scheduled_time,
              status: 'REQUESTED',
            },
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
          message: 'OK',
          data: [],
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
          },
          timestamp: Date.now(),
        }),
      });
    });
  });

  test('UC-01 & UC-02: Customer Login UI with validation and successful auth redirect', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Verify Login page heading
    await expect(page.locator('h1')).toContainText('Đăng nhập');

    // 1. Test invalid login credentials
    await page.fill('input[name="email"]', 'invalid@customer.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Verify error message is rendered
    await expect(page.locator('text=Email hoặc mật khẩu không chính xác.')).toBeVisible();

    // 2. Test valid customer credentials
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Secret123@');
    await page.click('button[type="submit"]');

    // Verify redirected towards customer profile
    await expect(page).toHaveURL(/.*\/customer\/profile/);
  });

  test('UC-04: Customer 3-Step Appointment Booking Wizard flow', async ({ page }) => {
    // Inject pre-authenticated customer credentials into localStorage
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'customer@example.com',
          fullName: 'Nguyễn Văn Khách',
          roles: ['CUSTOMER'],
        })
      );
      localStorage.setItem('token', 'mock-customer-jwt-token-12345');
    });

    await page.goto('http://localhost:3000/customer/appointments/new');

    // Verify Title & Wizard step 1
    await expect(page.locator('h1')).toContainText('Đặt lịch hẹn mới');
    await expect(page.locator('text=1. Chọn phương tiện của bạn')).toBeVisible();

    // Wait for vehicles to load and click on first vehicle
    const vehicleCard = page.locator('text=51A-999.99').first();
    await expect(vehicleCard).toBeVisible();
    await vehicleCard.click();

    // Proceed to Step 2
    await page.click('button:has-text("Tiếp theo")');

    // Verify Step 2: Dịch vụ
    await expect(page.locator('text=2. Bạn cần chúng tôi làm gì?')).toBeVisible();

    // Choose service checkbox: Thay dầu động cơ và lọc dầu
    const serviceCheckbox = page.locator('input[type="checkbox"]').first();
    await serviceCheckbox.check();

    // Fill notes
    await page.fill('textarea', 'Xe có tiếng kêu nhẹ khi khởi động vào buổi sáng');

    // Proceed to Step 3
    await page.click('button:has-text("Tiếp theo")');

    // Verify Step 3: Thời gian
    await expect(page.locator('text=3. Chọn ngày và giờ mang xe đến')).toBeVisible();

    // Fill date and time
    const today = new Date();
    const futureDate = new Date(today.getTime() + 86400000 * 2); // 2 days later
    const dateStr = futureDate.toISOString().split('T')[0];

    await page.fill('input[type="date"]', dateStr);
    await page.fill('input[type="time"]', '09:30');

    // Confirm booking
    await page.click('button:has-text("Xác nhận đặt lịch")');

    // Verify success toast notification
    await expect(page.locator('text=Đặt lịch hẹn thành công!')).toBeVisible();

    // Should redirect to appointments list
    await expect(page).toHaveURL(/.*\/customer\/appointments/, { timeout: 10000 });
  });

  test('UC-03: Customer Vehicle Management view', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'customer@example.com',
          fullName: 'Nguyễn Văn Khách',
          roles: ['CUSTOMER'],
        })
      );
      localStorage.setItem('token', 'mock-customer-jwt-token-12345');
    });

    await page.goto('http://localhost:3000/customer/vehicles');

    // Route redirects to profile?tab=vehicles
    await expect(page).toHaveURL(/.*\/customer\/profile\?tab=vehicles/);

    // Verify vehicle cards are rendered with license plate and make/model
    await expect(page.locator('text=51A-999.99').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Honda').first()).toBeVisible();
  });
});
