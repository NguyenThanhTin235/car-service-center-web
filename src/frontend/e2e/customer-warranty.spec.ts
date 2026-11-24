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
  summary: {
    totalItems: 3,
    validItems: 2,
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
      warrantyMonths: 6,
      expirationDate: '2027-03-01T08:00:00.000Z',
      daysRemaining: 98,
      status: 'VALID',
      overdueDays: 0,
    },
    {
      id: 11,
      type: 'PART',
      name: 'Lọc gió điều hòa',
      woNumber: 'WO-2026-011',
      workOrderId: 11,
      completedDate: '2026-08-01T08:00:00.000Z',
      warrantyMonths: 12,
      expirationDate: '2027-08-01T08:00:00.000Z',
      daysRemaining: 250,
      status: 'VALID',
      overdueDays: 0,
    },
    {
      id: 22,
      type: 'PART',
      name: 'Bình ắc quy GS',
      woNumber: 'WO-2025-099',
      workOrderId: 9,
      completedDate: '2025-01-10T08:00:00.000Z',
      warrantyMonths: 12,
      expirationDate: null,
      daysRemaining: 0,
      status: 'EXPIRED',
      overdueDays: 180,
    },
  ],
};

test.describe('Customer Portal E2E: Warranty Tracking (Months-Only, 2 Statuses)', () => {
  test('E2E-CUST-WAR-01: /customer/warranty 4-state error + retry, 2 statuses (Còn hạn / Quá hạn), filter tabs & no ODO input', async ({
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

    // 2. Data state renders all 3 items & ODO input is completely gone
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('Lọc gió điều hòa')).toBeVisible();
    await expect(page.getByText('Bình ắc quy GS')).toBeVisible();
    await expect(page.locator('#warranty-odo-input')).toHaveCount(0);

    // 3. Filter tabs work with 2 statuses (Còn hạn / Quá hạn)
    await page.getByRole('button', { name: /Còn hạn/i }).click();
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeVisible();
    await expect(page.getByText('Bình ắc quy GS')).toBeHidden();

    await page.getByRole('button', { name: /Quá hạn/i }).click();
    await expect(page.getByText('Bình ắc quy GS')).toBeVisible();
    await expect(page.getByText('Thay dầu động cơ 5W-30')).toBeHidden();

    expect(pageErrors).toEqual([]);
  });

  test('E2E-CUST-WAR-02: /customer/profile?tab=warranty embeds WarrantyView without header title', async ({
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
    await expect(page.getByRole('heading', { name: 'Bảo hành & Hậu mãi' })).toHaveCount(0);
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
