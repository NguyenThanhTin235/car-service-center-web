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

const MOCK_CLAIM = {
  id: 501,
  vehicle_id: 10,
  customer_id: 1,
  parent_wo_id: 201,
  intake_id: null,
  overdue_days: 12,
  overdue_km: 350,
  complaint: 'Máy lạnh kém mát sau 6 tháng bảo dưỡng',
  status: 'PENDING',
  support_type: null,
  support_pct: null,
  approval_note: null,
  created_at: '2026-11-20T09:00:00.000Z',
  vehicle: {
    id: 10,
    license_plate: '51F-555.66',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
  },
  customer: {
    id: 1,
    full_name: 'Nguyễn Văn Minh',
    phone: '0908111222',
    email: 'minh@example.com',
  },
  created_by: {
    id: 4,
    full_name: 'Lễ Tân Lan',
  },
  parent_wo: {
    id: 201,
    wo_number: 'WO-2026-201',
    completed_at: '2026-05-01T10:00:00.000Z',
    odometer_at_release: 40000,
  },
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

test.describe('Internal Portal E2E: Warranty Synchronization (UC-81..UC-87)', () => {
  test('E2E-INT-WAR-01: Manager Goodwill (/warranty) Error Retry, Detail Modal & Approve', async ({
    page,
  }) => {
    await setupDefaultApiCatchAll(page);
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-manager-jwt');
    }, MANAGER_USER);

    let listCalls = 0;
    await page.route('**/api/warranty/goodwill-claims?**', async (route) => {
      listCalls += 1;
      if (listCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Không thể tải danh sách thiện chí' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            claims: [MOCK_CLAIM],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          },
        }),
      });
    });

    await page.route('**/api/warranty/goodwill-claims/501', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            claim: MOCK_CLAIM,
            customerStats: {
              totalCompletedOrders: 6,
              isLoyalCustomer: true,
              historyOrders: [{ id: 201, wo_number: 'WO-2026-201', status: 'RELEASED' }],
            },
          },
        }),
      });
    });

    let approvePayload: any = null;
    await page.route('**/api/warranty/goodwill-claims/501/approve', async (route) => {
      approvePayload = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...MOCK_CLAIM, status: 'APPROVED', ...approvePayload },
        }),
      });
    });

    await page.goto(`${INTERNAL_BASE_URL}/warranty`);

    // 1. Error & Retry
    const retryBtn = page.getByRole('button', { name: /Thử lại/i });
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // 2. Claim row rendered
    await expect(page.getByText('51F-555.66')).toBeVisible();
    await expect(page.getByText('Nguyễn Văn Minh')).toBeVisible();

    // 3. Open detail modal & approve
    await page.getByRole('button', { name: /Thẩm định/i }).click();
    await expect(page.getByText(/\(Thân thiết\)/)).toBeVisible();
    await page.locator('textarea[placeholder*="Nhập căn cứ phê duyệt"]').fill('Khách hàng thân thiết, đồng ý hỗ trợ');
    await page.getByRole('button', { name: /Phê duyệt hỗ trợ/i }).click();

    await expect.poll(() => approvePayload).not.toBeNull();
  });

  test('E2E-INT-WAR-02: Manager Warranty Report (/reports) renders KPIs, chart & faulty parts', async ({
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
    await page.getByRole('button', { name: /Báo cáo Bảo hành/i }).click();
    await expect(page.getByText('Lốc lạnh điều hòa')).toBeVisible();
  });

  test('E2E-INT-WAR-03: Staff Intake (/staff/intake) WARRANTY badge, ODO anti-tamper & Billing 0đ badge', async ({
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
          data: [{ id: 201, woNumber: 'WO-2026-201', completedDate: '2026-08-01', releaseOdo: 55000 }],
        }),
      });
    });

    await page.route('**/api/warranty/validate-odo', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const isValid = Number(body.intakeOdo) >= 55000;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            valid: isValid,
            parentWoId: 201,
            woNumber: 'WO-2026-201',
            lastRecordedOdo: 55000,
            intakeOdo: Number(body.intakeOdo),
            message: isValid ? 'ODO hợp lệ' : 'ODO nhỏ hơn lần xuất xưởng trước',
          },
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
            currentOdo: 56000,
            summary: { totalItems: 1, validItems: 1, overdueLightItems: 0, expiredItems: 0 },
            items: [
              {
                id: 1,
                type: 'SERVICE',
                name: 'Bảo dưỡng điều hòa',
                woNumber: 'WO-2026-201',
                workOrderId: 201,
                completedDate: '2026-08-01',
                completedOdo: 55000,
                warrantyMonths: 6,
                warrantyMileage: 10000,
                expirationDate: '2027-02-01',
                expirationMileage: 65000,
                daysRemaining: 60,
                kmRemaining: 9000,
                status: 'VALID',
                overdueDays: 0,
                overdueKm: 0,
                reason: 'Còn hạn',
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${INTERNAL_BASE_URL}/staff/intake`);
    await expect(page.getByText('Bảo hành').first()).toBeVisible();

    // Open WarrantyIntakeModal
    await page.getByRole('button', { name: /Tiếp nhận bảo hành/i }).click();
    await expect(page.getByText('Tiếp nhận xe bảo hành (UC-83)')).toBeVisible();

    const selects = page.locator('form select');
    await selects.nth(0).selectOption('1');
    await selects.nth(1).selectOption('10');

    const odoInput = page.locator('input[placeholder="VD: 52000"]');
    await odoInput.fill('50000');
    await expect(page.getByText(/Cảnh báo nghi vấn tua lùi ODO/i)).toBeVisible();

    await odoInput.fill('56000');
    await expect(page.getByText(/Đủ điều kiện bảo hành tiêu chuẩn/i)).toBeVisible();

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

  test('E2E-INT-WAR-04: Responsive layout check across 4 viewports (390, 768, 1024, 1440)', async ({
    page,
  }) => {
    await setupDefaultApiCatchAll(page);
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-manager-jwt');
    }, MANAGER_USER);

    await page.route('**/api/warranty/goodwill-claims?**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            claims: [MOCK_CLAIM],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          },
        }),
      });
    });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${INTERNAL_BASE_URL}/warranty`);
      await expect(page.getByText('51F-555.66')).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      expect(hasHorizontalOverflow, `Overflow detected on viewport ${vp.name}`).toBe(false);
    }
  });
});
