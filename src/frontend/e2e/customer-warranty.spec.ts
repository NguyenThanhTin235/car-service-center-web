import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const MOCK_ELIGIBILITY_RESPONSE = {
  hasHistory: true,
  vehicle: {
    id: 101,
    licensePlate: '51H-888.99',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
  },
  currentOdo: 25000,
  summary: {
    totalItems: 3,
    validItems: 1,
    overdueLightItems: 1,
    expiredItems: 1,
  },
  items: [
    {
      id: 11,
      type: 'SERVICE',
      name: 'Thay dầu động cơ 5W-30',
      woNumber: 'WO-2026-011',
      workOrderId: 11,
      completedDate: '2026-09-01T08:00:00.000Z',
      completedOdo: 20000,
      warrantyMonths: 6,
      warrantyMileage: 10000,
      expirationDate: '2027-03-01T08:00:00.000Z',
      expirationMileage: 30000,
      daysRemaining: 98,
      kmRemaining: 5000,
      status: 'VALID',
      overdueDays: 0,
      overdueKm: 0,
      reason: 'Trong hạn bảo hành',
    },
    {
      id: 11,
      type: 'PART',
      name: 'Lọc gió điều hòa',
      woNumber: 'WO-2026-011',
      workOrderId: 11,
      completedDate: '2026-05-01T08:00:00.000Z',
      completedOdo: 15000,
      warrantyMonths: 6,
      warrantyMileage: 10000,
      expirationDate: '2026-11-01T08:00:00.000Z',
      expirationMileage: 24500,
      daysRemaining: 0,
      kmRemaining: 0,
      status: 'OVERDUE_LIGHT',
      overdueDays: 22,
      overdueKm: 500,
      reason: 'Quá hạn nhẹ trong ngưỡng thiện chí',
    },
    {
      id: 22,
      type: 'PART',
      name: 'Bình ắc quy GS',
      woNumber: 'WO-2025-099',
      workOrderId: 9,
      completedDate: '2025-01-10T08:00:00.000Z',
      completedOdo: null,
      warrantyMonths: 12,
      warrantyMileage: 0,
      expirationDate: null,
      expirationMileage: null,
      daysRemaining: 0,
      kmRemaining: 0,
      status: 'EXPIRED',
      overdueDays: 180,
      overdueKm: 0,
      reason: 'Đã hết hạn bảo hành',
    },
  ],
};

test.describe('Customer Portal E2E: Warranty Tracking & Booking (/warranty & /customer/profile?tab=warranty)', () => {
  test('E2E-CUST-WAR-01: /warranty 4-state error + retry, eligibility cards, filter tabs & nullable fields', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);
    await injectCustomerSession(page);

    let eligibilityCalls = 0;
    await page.route('**/api/warranty/vehicles/*/eligibility**', async (route) => {
      eligibilityCalls += 1;
      if (eligibilityCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Lỗi tải dữ liệu bảo hành' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_ELIGIBILITY_RESPONSE,
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/customer/warranty`);

    // 1. Error state + Retry button
    const retryBtn = page.getByRole('button', { name: /Thử lại/i });
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // 2. Data state renders all 3 items including overlapping id=11 SERVICE vs PART & nullable fields
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('Lọc gió điều hòa')).toBeVisible();
    await expect(page.getByText('Bình ắc quy GS')).toBeVisible();

    // 3. Filter tabs work
    await page.getByRole('button', { name: /Đủ điều kiện/i }).click();
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('Bình ắc quy GS')).toBeHidden();

    await page.getByRole('button', { name: /^Dịch vụ$/i }).click();
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('Lọc gió điều hòa')).toBeHidden();

    expect(pageErrors).toEqual([]);
  });

  test('E2E-CUST-WAR-02: /customer/profile?tab=warranty embeds WarrantyView cleanly', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);
    await injectCustomerSession(page);

    await page.route('**/api/warranty/vehicles/*/eligibility**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_ELIGIBILITY_RESPONSE,
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=warranty`);
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('WO-2026-011').first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('E2E-CUST-WAR-03: Responsive layout check across 4 viewports (390, 768, 1024, 1440)', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);
    await injectCustomerSession(page);

    await page.route('**/api/warranty/vehicles/*/eligibility**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_ELIGIBILITY_RESPONSE,
        }),
      });
    });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${CUSTOMER_BASE_URL}/customer/warranty`);
      await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      expect(hasHorizontalOverflow, `Overflow detected on viewport ${vp.name}`).toBe(false);
    }

    expect(pageErrors).toEqual([]);
  });
});
