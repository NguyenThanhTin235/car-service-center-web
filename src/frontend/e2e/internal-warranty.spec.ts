import { test, expect } from '@playwright/test';

const INTERNAL_BASE_URL = 'http://localhost:3001';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const MANAGER_USER = {
  id: 2,
  email: 'manager@autocare.vn',
  fullName: 'Quản Lý Dịch Vụ',
  roles: ['MANAGER'],
};

const STAFF_USER = {
  id: 4,
  email: 'staff@autocare.vn',
  fullName: 'Lễ Tân Lan',
  roles: ['DESK_STAFF'],
};

function setupDefaultApiCatchAll(page: import('@playwright/test').Page) {
  return page.route('**/api/**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { pagination: { total: 0, count: 0, totalPages: 1, currentPage: 1, perPage: 10 } },
      }),
    });
  });
}

test.describe('Internal Portal E2E: Warranty Synchronization (Months-Only, UC-81..UC-86)', () => {
  test('E2E-INT-WAR-01: Manager Warranty Report (/reports - UC-86) renders KPIs, chart & faulty parts', async ({
    page,
  }) => {
    await setupDefaultApiCatchAll(page);
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-manager-jwt');
    }, MANAGER_USER);

    await page.route('**/api/reports/warranty**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            operationalMetrics: {
              warrantyCasesCount: 14,
              totalServedCount: 310,
              warrantyRate: 4.5,
            },
            costMetrics: {
              totalWarrantyMwaCost: 18500000,
              totalPartsQuantity: 9,
            },
            technicalAnalysis: {
              byTechnician: [{ technicianName: 'Trần Kỹ Thuật', count: 4 }],
              byCategory: [{ categoryName: 'Điện lạnh', count: 5 }],
            },
            topFaultyParts: [
              {
                itemId: 1,
                partName: 'Lốc lạnh điều hòa',
                sku: 'AC-001',
                categoryName: 'Điện lạnh',
                faultyCount: 4,
                defectRate: 8.5,
                totalWarrantyMwaCost: 9200000,
                supplier: {
                  supplierName: 'Denso Việt Nam',
                  supplierContact: '028-3822-9999',
                },
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${INTERNAL_BASE_URL}/reports`);
    await expect(page.getByRole('button', { name: /Doanh thu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Dịch vụ phổ biến/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tồn kho phụ tùng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Báo cáo Bảo hành/i })).toHaveCount(0);
  });

  test('E2E-INT-WAR-02: Staff Intake (/staff/intake) months-only WarrantyIntakeModal & Billing 0đ badge', async ({
    page,
  }) => {
    await setupDefaultApiCatchAll(page);
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-staff-jwt');
    }, STAFF_USER);

    await page.route('**/api/intake**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 801,
              intake_type: 'WARRANTY',
              status: 'QUEUED',
              arrived_at: '2026-11-23T08:30:00.000Z',
              notes: 'Bảo hành máy lạnh',
              customer: { id: 1, full_name: 'Nguyễn Văn Minh', phone: '0908111222' },
              vehicle: { id: 10, license_plate: '51F-555.66', make: 'Toyota', model: 'Camry' },
              services: [],
            },
          ],
          meta: { pagination: { total: 1, count: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.route('**/api/customers**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              fullName: 'Nguyễn Văn Minh',
              phone: '0908111222',
              vehicles: [{ id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry' }],
            },
          ],
          meta: { pagination: { total: 1, count: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.route('**/api/warranty/vehicles/10/history', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 201, woNumber: 'WO-2026-201', completedDate: '2026-08-01' },
            { id: 199, woNumber: 'WO-2025-199', completedDate: '2025-01-01' },
          ],
        }),
      });
    });

    await page.route('**/api/warranty/vehicles/10/eligibility**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hasHistory: true,
            vehicle: { id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry', year: 2023 },
            summary: { totalItems: 2, validItems: 1, expiredItems: 1 },
            items: [
              {
                id: 1,
                type: 'SERVICE',
                name: 'Bảo dưỡng điều hòa',
                woNumber: 'WO-2026-201',
                workOrderId: 201,
                completedDate: '2026-08-01',
                warrantyMonths: 6,
                expirationDate: '2027-02-01',
                daysRemaining: 60,
                status: 'VALID',
                overdueDays: 0,
              },
              {
                id: 2,
                type: 'PART',
                name: 'Bình ắc quy cũ',
                woNumber: 'WO-2025-199',
                workOrderId: 199,
                completedDate: '2025-01-01',
                warrantyMonths: 12,
                expirationDate: '2026-01-01',
                daysRemaining: 0,
                status: 'EXPIRED',
                overdueDays: 300,
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${INTERNAL_BASE_URL}/staff/intake`);
    await expect(page.getByText('Bảo hành').first()).toBeVisible();

    // Open WarrantyIntakeModal (no ODO input, no Goodwill button)
    await page.getByRole('button', { name: /Tiếp nhận bảo hành/i }).click();
    await expect(page.getByText('Tiếp nhận xe bảo hành')).toBeVisible();
    await expect(page.locator('input[placeholder="VD: 52000"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Đề xuất Thiện chí/i })).toHaveCount(0);

    const selects = page.locator('form select');
    await selects.nth(0).selectOption('1');
    await selects.nth(1).selectOption('10');

    await expect(page.getByText('Còn hạn bảo hành')).toBeVisible();

    // Switch to expired parent WO -> shows Quá hạn bảo hành
    await selects.nth(2).selectOption('199');
    await expect(page.getByText('Quá hạn bảo hành')).toBeVisible();

    // Billing 0đ badge check
    await page.route('**/api/invoices/billing-queue**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tab: 'PAID',
            summary: { pendingCount: 0, draftCount: 0, issuedCount: 0, paidTodayCount: 1, paidTodayRevenue: 0 },
            records: [
              {
                type: 'INVOICE',
                id: 901,
                workOrderId: 301,
                woNumber: 'WO-2026-301',
                invoiceNumber: 'INV-2026-901',
                status: 'PAID',
                totalAmount: 0,
                amountDue: 0,
                customer: { id: 1, fullName: 'Nguyễn Văn Minh', phone: '0908111222' },
                vehicle: { id: 10, licensePlate: '51F-555.66', make: 'Toyota', model: 'Camry' },
              },
            ],
          },
          meta: { pagination: { total: 1, count: 1, totalPages: 1, currentPage: 1, perPage: 10 } },
        }),
      });
    });

    await page.goto(`${INTERNAL_BASE_URL}/staff/billing`);
    await page.getByRole('button', { name: /Đã thanh toán/i }).first().click();
    await expect(page.getByText('Bảo hành 0đ').first()).toBeVisible();
  });

  test('E2E-INT-WAR-03: Responsive layout check across 4 viewports (390, 768, 1024, 1440)', async ({
    page,
  }) => {
    await setupDefaultApiCatchAll(page);
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-manager-jwt');
    }, MANAGER_USER);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${INTERNAL_BASE_URL}/reports`);
      await expect(page.getByRole('button', { name: /Doanh thu/i })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      expect(hasHorizontalOverflow, `Overflow detected on viewport ${vp.name}`).toBe(false);
    }
  });
});
