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

const MOCK_INTAKE_QUEUE = [
  {
    id: 201,
    customer_id: 1,
    vehicle_id: 10,
    intake_type: 'WALK_IN',
    status: 'QUEUED',
    arrived_at: new Date().toISOString(),
    notes: 'Kiểm tra gầm',
    customer: { id: 1, full_name: 'Phạm Hoàng Nam', phone: '0918222333', email: 'nam@gmail.com' },
    vehicle: { id: 10, license_plate: '51K-888.99', make: 'Mazda', model: 'CX-5', color: 'Xanh', vehicle_size: 'MEDIUM' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [{ id: 1, service: { id: 1, name: 'Bảo dưỡng gầm' } }],
  },
  {
    id: 202,
    customer_id: 2,
    vehicle_id: 11,
    intake_type: 'TOW_IN',
    status: 'QUEUED',
    tow_company: 'Cứu hộ 115 Sài Gòn',
    arrived_at: new Date().toISOString(),
    notes: 'Xe chết máy trên cao tốc',
    customer: { id: 2, full_name: 'Nguyễn Văn Sơn', phone: '0933444555', email: 'son@gmail.com' },
    vehicle: { id: 11, license_plate: '51D-777.00', make: 'Ford', model: 'Ranger', color: 'Bạc', vehicle_size: 'LARGE' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    services: [],
  },
  {
    id: 203,
    customer_id: 3,
    vehicle_id: 12,
    intake_type: 'WALK_IN',
    status: 'CONVERTED',
    arrived_at: new Date().toISOString(),
    notes: 'Đã chuyển cố vấn lập lệnh',
    customer: { id: 3, full_name: 'Lê Hoàng Long', phone: '0919555666', email: 'long@gmail.com' },
    vehicle: { id: 12, license_plate: '51A-999.11', make: 'Toyota', model: 'Vios', color: 'Đen', vehicle_size: 'SMALL' },
    created_by: { id: 4, full_name: 'Lễ Tân Lan' },
    work_order: { id: 90, wo_number: 'WO-2026-090' },
    services: [],
  },
];

test.describe('Desk-Staff Portal E2E: Vehicle Intake (/staff/intake)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 50 },
          meta: { pagination: { total: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.route('**/api/customers**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [{ id: 1, fullName: 'Phạm Hoàng Nam', phone: '0918222333', vehicles: [] }],
        }),
      });
    });

    await page.route('**/api/services**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 1, name: 'Bảo dưỡng gầm', base_price: 450000 }],
        }),
      });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt-token');
    }, CURRENT_STAFF);
  });

  test('E2E-STF-INT-01: Hiển thị hàng đợi tiếp nhận, chuyển tab trạng thái, tìm kiếm & validate WalkIn/TowIn modals', async ({
    page,
  }) => {
    await page.route('**/api/intake**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_INTAKE_QUEUE,
          meta: { pagination: { total: MOCK_INTAKE_QUEUE.length, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/intake', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Tiếp nhận xe vào xưởng")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=51K-888.99').first()).toBeVisible();
    await expect(page.locator('text=51D-777.00').first()).toBeVisible();

    // Search filters client queue
    const searchInput = page.locator('input[placeholder="Tìm biển số, khách hàng, SĐT..."]');
    await searchInput.fill('51D-777');
    await expect(page.locator('text=51D-777.00').first()).toBeVisible();
    await expect(page.locator('text=51K-888.99')).toHaveCount(0);
    await searchInput.fill('');

    // Switch tab to CONVERTED (client-side filter) and back to QUEUED
    await page.getByRole('button', { name: /Đã chuyển RO/i }).click();
    await expect(page.locator('text=51A-999.11').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Chờ xử lý/i }).last().click();

    // WalkInIntakeModal validation check
    await page.locator('button:has-text("+ Tiếp nhận khách vãng lai")').click();
    await expect(page.locator('text=Tiếp nhận Khách vãng lai').first()).toBeVisible();
    await page.getByRole('button', { name: 'Tạo phiếu tiếp nhận', exact: true }).click();
    await expect(page.locator('text=Vui lòng chọn khách hàng')).toBeVisible();
    await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();

    // TowInIntakeModal validation check
    await page.locator('button:has-text("Tiếp nhận xe cứu hộ")').click();
    await expect(page.locator('text=Tiếp nhận Xe cứu hộ').first()).toBeVisible();
    await page.getByRole('button', { name: 'Tạo phiếu tiếp nhận xe cứu hộ' }).click();
    await expect(
      page.locator('text=Đơn vị kéo xe / Người bàn giao không được để trống')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();
  });

  test('E2E-STF-INT-02: Error banner Retry khi API 500, Empty state CTA và kiểm tra 4 viewports', async ({
    page,
  }) => {
    let intakeCalls = 0;
    await page.route('**/api/intake**', async (route) => {
      intakeCalls += 1;
      if (intakeCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Server error loading queue' }),
        });
      }
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/intake', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Không thể đồng bộ dữ liệu tiếp nhận:')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Thử lại' }).click();

    await expect(page.locator('text=Danh sách tiếp nhận trống.')).toBeVisible({ timeout: 10000 });
    expect(intakeCalls).toBeGreaterThanOrEqual(2);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    }
  });

  test('E2E-STF-INT-03: Chi tiết phiếu tiếp nhận trạng thái Đã hủy hiển thị Lý do hủy phiếu', async ({
    page,
  }) => {
    await page.route('**/api/intake**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 88,
              intake_type: 'WALK_IN',
              status: 'CANCELLED',
              arrived_at: '2026-11-14T08:00:00Z',
              notes: '[Tình trạng xe]: Trầy nhẹ cản trước\n\n[Ghi chú]: Khách cần gấp\n\n[Lý do hủy]: Khách bận việc đột xuất nên hẹn lại hôm khác',
              customer: { id: 1, full_name: 'Trần Văn B', phone: '0908777666', email: 'b@example.com' },
              vehicle: { id: 10, license_plate: '51K-999.88', make: 'Mazda', model: 'CX-5', vehicle_size: 'MEDIUM', color: 'Đỏ' },
              services: [],
            },
          ],
          meta: { pagination: { total: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/staff/intake', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Đã hủy/i }).last().click();
    await expect(page.locator('text=Trần Văn B').first()).toBeVisible({ timeout: 10000 });
    await page.locator('button[title="Xem chi tiết"]').first().click();

    await expect(page.locator('text=Chi tiết phiếu tiếp nhận')).toBeVisible();
    await expect(page.locator('text=Trạng thái: Đã hủy')).toBeVisible();
    await expect(page.getByTestId('intake-cancel-reason')).toBeVisible();
    await expect(page.getByTestId('intake-cancel-reason')).toContainText(
      'Khách bận việc đột xuất nên hẹn lại hôm khác'
    );
    await page.getByRole('button', { name: 'Đóng' }).click();
  });
});
