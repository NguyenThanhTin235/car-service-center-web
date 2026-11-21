import { test, expect } from '@playwright/test';

const CURRENT_SA = {
  id: 2,
  email: 'advisor@autocare.vn',
  fullName: 'Trần Cố Vấn',
  roles: ['SA'],
};

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-960', width: 960, height: 1440 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const MOCK_FINDINGS = [
  {
    id: 701,
    inspection_id: 1,
    marker_type: 'DENT',
    coordinates: { part_id: 'driver_front_door', x: 35, y: 45 },
    part_name: 'Cửa trước bên lái',
    description: 'Móp nhẹ góc dưới cửa lái',
    evidence_urls: ['https://example.com/dent-door.jpg'],
    job_findings: [],
  },
];

const MOCK_PARTS = [
  {
    id: 801,
    job_id: 901,
    item_id: 1,
    planned_quantity: 2,
    issued_quantity: 0,
    unit_price: 250000,
    status: 'PLANNED',
    item: {
      id: 1,
      sku: 'OIL-5W30',
      on_hand: 10,
      part_category: { name: 'Dầu nhớt tổng hợp 5W-30', uom: { name: 'Lít' } },
      brand: { name: 'Castrol' },
    },
    job: {
      id: 901,
      name: 'Chẩn đoán lỗi OBD-II',
      status: 'PLANNED',
      wo_service: { name: 'Sửa chữa động cơ bỏ máy' },
    },
  },
];

const MOCK_QUOTATIONS = [
  {
    id: 301,
    workOrderId: 101,
    quotationNumber: 'QUO-WO-261018-001-01',
    quotationType: 'PRIMARY',
    parentQuotationId: null,
    status: 'SENT',
    subtotal: 5000000,
    discountAmount: 0,
    taxRate: 10,
    taxAmount: 500000,
    grandTotal: 5500000,
    sentAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectReason: null,
    snapshotAt: null,
    createdBy: { id: 2, full_name: 'Trần Cố Vấn' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLatestSent: true,
    lines: [
      {
        id: 1,
        lineType: 'LABOUR',
        description: 'Công chẩn đoán & sửa chữa động cơ bỏ máy',
        quantity: 1,
        snapshotUnitPrice: 4500000,
        amount: 4500000,
        sortOrder: 1,
        woServiceId: 501,
        woServiceName: 'Sửa chữa động cơ bỏ máy',
        jobId: 901,
        jobName: 'Chẩn đoán lỗi OBD-II',
      },
      {
        id: 2,
        lineType: 'PART',
        description: 'Dầu nhớt tổng hợp 5W-30',
        quantity: 2,
        snapshotUnitPrice: 250000,
        amount: 500000,
        sortOrder: 2,
        woServiceId: 501,
        woServiceName: 'Sửa chữa động cơ bỏ máy',
        jobId: 901,
        jobName: 'Chẩn đoán lỗi OBD-II',
      },
    ],
  },
];

const MOCK_QC_DETAILS = {
  workOrder: {
    id: 101,
    woNumber: 'WO-261018-001',
    status: 'IN_PROGRESS',
    licensePlate: '51A-999.99',
    vehicleModel: 'Honda CR-V',
    customerName: 'Nguyễn Văn Khách',
    advisorName: 'Trần Cố Vấn',
  },
  stats: {
    totalServices: 1,
    passedServices: 0,
    totalJobs: 1,
    completedJobs: 1,
    passedJobs: 0,
    reworkJobs: 0,
    progressPercent: 0,
    canRequestBilling: false,
    isBillingRequested: false,
  },
  services: [
    {
      id: 501,
      serviceId: 10,
      name: 'Sửa chữa động cơ bỏ máy',
      status: 'IN_PROGRESS',
      pricingType: 'LABOUR_PARTS',
      jobs: [
        {
          id: 901,
          name: 'Chẩn đoán lỗi OBD-II',
          status: 'COMPLETED',
          isRework: false,
          parentJobId: null,
          reworkSourceQcItemId: null,
          technician: 'Hồ Văn Lâm',
        },
      ],
      template: {
        id: 1,
        name: 'KCS Động cơ',
        items: [
          { id: 1, name: 'Kiểm tra mã lỗi OBD-II sau sửa chữa' },
        ],
      },
      latestQc: null,
    },
  ],
};

function buildMockWorkOrder(status: string) {
  return {
    id: 101,
    wo_number: 'WO-261018-001',
    status,
    source_type: 'WALK_IN',
    created_at: new Date().toISOString(),
    customer: {
      id: 1,
      full_name: 'Nguyễn Văn Khách',
      phone: '0901234567',
      email: 'khach@example.com',
    },
    vehicle: {
      id: 10,
      license_plate: '51A-999.99',
      make: 'Honda',
      model: 'CR-V',
      year: 2022,
      color: 'Trắng',
      vehicle_size: 'LARGE',
    },
    advisor: {
      id: 2,
      full_name: 'Trần Cố Vấn',
    },
    check_in: {
      id: 201,
      mileage: 45000,
      fuel_level: 50,
      exterior_condition: 'Bình thường',
      belongings: 'Sổ bảo hành',
      evidence_urls: [],
      complaint: JSON.stringify({ tags: ['Đèn Check Engine sáng'], notes: 'Xe rung nhẹ khi nổ máy.' }),
      intake_cost_estimate: 5500000,
    },
    services: [
      {
        id: 501,
        name: 'Sửa chữa động cơ bỏ máy',
        pricing_type: 'LABOUR_PARTS',
        status: 'PENDING',
        jobs: [
          {
            id: 901,
            name: 'Chẩn đoán lỗi OBD-II',
            status: 'PLANNED',
            estimated_hours: 1.0,
            job_type_name: 'Sửa chữa điện - điện tử',
            job_type_id: 1,
            parts: MOCK_PARTS,
          },
        ],
      },
      {
        id: 502,
        name: 'Bảo dưỡng hệ thống phanh',
        pricing_type: 'FIXED_PACKAGE',
        status: 'PENDING',
        jobs: [
          {
            id: 902,
            name: 'Vệ sinh má phanh 4 bánh',
            status: 'PLANNED',
            estimated_hours: 0.5,
            job_type_name: 'Bảo dưỡng nhanh',
            job_type_id: 2,
            parts: [],
          },
        ],
      },
    ],
    inspections: [
      {
        id: 1,
        work_order_id: 101,
        status: 'COMPLETED',
        findings: MOCK_FINDINGS,
      },
    ],
  };
}

test.describe('SA Portal E2E: Work Order Detail Tabs (/advisor/work-orders/[id])', () => {
  let mockWoStatus = 'IN_PROGRESS';

  test.beforeEach(async ({ page }) => {
    mockWoStatus = 'IN_PROGRESS';

    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-sa-jwt-token');
    }, CURRENT_SA);

    // 0. Global fallback for any unintercepted /api/** calls
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [],
          meta: { pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
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
          data: CURRENT_SA,
          timestamp: Date.now(),
        }),
      });
    });

    await page.route(/\/api\/work-orders(\?.*)?$/, async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [buildMockWorkOrder(mockWoStatus)],
          meta: { pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } },
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/work-orders/101', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: buildMockWorkOrder(mockWoStatus),
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/work-orders/101/inspection**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            id: 1,
            work_order_id: 101,
            status: 'COMPLETED',
            created_by_id: 2,
            findings: MOCK_FINDINGS,
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/work-orders/101/parts**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: MOCK_PARTS,
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/quotations/work-orders/101**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: MOCK_QUOTATIONS,
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/work-orders/101/qc**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: MOCK_QC_DETAILS,
          timestamp: Date.now(),
        }),
      });
    });

    await page.route('**/api/employees**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [{ id: 12, fullName: 'Hồ Văn Lâm', position: 'TECHNICIAN', isActive: true }],
          timestamp: Date.now(),
        }),
      });
    });
  });

  test('E2E-SA-DET-01: Sticky Header + ChevronPipeline, Keep-Alive 6 Tabs + ?tab= URL sync, 5-viewport overflow check', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor/work-orders/101', { waitUntil: 'domcontentloaded' });

    // 1. Sticky Header + ChevronPipeline
    const stickyBar = page.locator('div.sticky').filter({ hasText: 'WO-261018-001' }).first();
    await expect(stickyBar).toBeVisible({ timeout: 20000 });
    await expect(stickyBar.getByText('Tiếp nhận')).toBeVisible();
    await expect(stickyBar.getByText('Đang sửa')).toBeVisible();
    await expect(stickyBar.getByText('Chờ giao xe')).toBeVisible();
    await expect(stickyBar.getByText('Đóng')).toBeVisible();

    // 2. All 6 Tabs visible
    const tabBar = page
      .locator('div.rounded-2xl')
      .filter({ hasText: 'Tiếp nhận & Kiểm tra' })
      .filter({ hasText: 'Kiểm tra chất lượng' })
      .first();

    const tabLabels = [
      { id: 'checkin', label: 'Tiếp nhận & Kiểm tra' },
      { id: 'job', label: 'Hạng mục sửa chữa' },
      { id: 'parts', label: 'Phụ tùng' },
      { id: 'quotation', label: 'Báo giá' },
      { id: 'qc', label: 'Kiểm tra chất lượng' },
      { id: 'release', label: 'Giao xe' },
    ];
    for (const tab of tabLabels) {
      await expect(tabBar.getByRole('button', { name: new RegExp(tab.label) })).toBeVisible();
    }

    // 3. ?tab= URL query sync + Keep-Alive state preservation
    await tabBar.getByRole('button', { name: /Hạng mục sửa chữa/ }).click();
    await expect(page).toHaveURL(/\/advisor\/work-orders\/101\?tab=job/);

    const jobSearchInput = page.locator('input[placeholder="Tìm hạng mục hoặc công việc..."]');
    await expect(jobSearchInput).toBeVisible();
    await jobSearchInput.fill('động cơ');

    // Switch to Tab 3 (parts) and back to Tab 2 (job) — Keep-Alive must preserve search value
    await tabBar.getByRole('button', { name: /Phụ tùng/ }).click();
    await expect(page).toHaveURL(/\/advisor\/work-orders\/101\?tab=parts/);
    await expect(page.getByText('Dầu nhớt tổng hợp 5W-30')).toBeVisible();

    await tabBar.getByRole('button', { name: /Hạng mục sửa chữa/ }).click();
    await expect(page).toHaveURL(/\/advisor\/work-orders\/101\?tab=job/);
    await expect(jobSearchInput).toHaveValue('động cơ');

    // Reload with ?tab=job — URL query sync restores Tab 2 on mount
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/advisor\/work-orders\/101\?tab=job/);
    const activeJobTabBtn = tabBar.getByRole('button', { name: /Hạng mục sửa chữa/ });
    await expect(activeJobTabBtn).toBeVisible({ timeout: 20000 });
    await expect(activeJobTabBtn).toHaveClass(/bg-\[#0050cd\]/);
    await expect(page.locator('input[placeholder="Tìm hạng mục hoặc công việc..."]')).toBeVisible();

    // 4. 5-viewport horizontal overflow check
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scrollWidth,
        `Horizontal overflow detected at ${vp.name} (${vp.width}x${vp.height}): scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`
      ).toBeLessThanOrEqual(overflow.clientWidth + 2);
    }
  });

  test('E2E-SA-DET-02: Verify key interactions across all 6 tabs at 960x1440', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 1440 });
    await page.goto('http://localhost:3001/advisor/work-orders/101', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('WO-261018-001').first()).toBeVisible({ timeout: 20000 });

    // Tab 1 (checkin): tap marker on InteractiveCarSVG opens tooltip; findings list has horizontal scroll wrapper without "Chú thích:"
    const svgMarker = page.locator('div[style*="left: 35%"][style*="top: 45%"]').first();
    await expect(svgMarker).toBeVisible();
    await svgMarker.click();
    const tooltip = svgMarker.locator('div.z-50').first();
    await expect(tooltip).toBeVisible();
    await expect(tooltip.getByText('Cửa trước bên lái')).toBeVisible();

    const findingsScrollWrapper = page.locator('div.md\\:overflow-x-auto').filter({ hasText: 'Loại dấu vết' }).first();
    await expect(findingsScrollWrapper).toBeVisible();
    await expect(page.getByText('Chú thích:')).toHaveCount(0);

    const tabBar = page
      .locator('div.rounded-2xl')
      .filter({ hasText: 'Tiếp nhận & Kiểm tra' })
      .filter({ hasText: 'Kiểm tra chất lượng' })
      .first();

    // Tab 2 (job): service header + "Chờ xử lý" badge + search filter
    await tabBar.getByRole('button', { name: /Hạng mục sửa chữa/ }).click();
    await expect(page).toHaveURL(/\?tab=job/);
    const activePanel = page.locator('div.pt-5 > div.block');
    await expect(activePanel.getByText('Sửa chữa động cơ bỏ máy').first()).toBeVisible();
    await expect(activePanel.getByText('Bảo dưỡng hệ thống phanh').first()).toBeVisible();
    await expect(activePanel.getByText('Chờ xử lý').first()).toBeVisible();

    const jobFilter = activePanel.locator('input[placeholder="Tìm hạng mục hoặc công việc..."]');
    await jobFilter.fill('phanh');
    await expect(activePanel.getByText('Bảo dưỡng hệ thống phanh').first()).toBeVisible();
    await expect(activePanel.getByText('Sửa chữa động cơ bỏ máy')).toHaveCount(0);

    // Tab 3 (parts): consolidated "DK / Xuất" & "Thành tiền" layout at 960x1440
    await tabBar.getByRole('button', { name: /Phụ tùng/ }).click();
    await expect(page).toHaveURL(/\?tab=parts/);
    await expect(activePanel.getByRole('columnheader', { name: 'DK / Xuất' })).toBeVisible();
    await expect(activePanel.getByRole('columnheader', { name: 'Thành tiền' })).toBeVisible();
    await expect(activePanel.getByText('Dầu nhớt tổng hợp 5W-30')).toBeVisible();

    // Tab 4 (quotation): quotation table + QuotationHistoryModal
    await tabBar.getByRole('button', { name: /Báo giá/ }).click();
    await expect(page).toHaveURL(/\?tab=quotation/);
    await expect(activePanel.getByText('QUO-WO-261018-001-01').first()).toBeVisible();
    await expect(activePanel.getByText('Công chẩn đoán & sửa chữa động cơ bỏ máy').first()).toBeVisible();

    await activePanel.getByRole('button', { name: /Lịch sử \(1\)/ }).click();
    await expect(page.getByRole('heading', { name: /Lịch sử các phiên bản Báo giá/i })).toBeVisible();
    await page.locator('button[title="Đóng modal"]').click();
    await expect(page.getByRole('heading', { name: /Lịch sử các phiên bản Báo giá/i })).toHaveCount(0);

    // Tab 5 (qc): checklist items + "Chờ đánh giá" pill
    await tabBar.getByRole('button', { name: /Kiểm tra chất lượng/ }).click();
    await expect(page).toHaveURL(/\?tab=qc/);
    await expect(activePanel.getByText('Kiểm tra mã lỗi OBD-II sau sửa chữa')).toBeVisible();
    await expect(activePanel.getByText('Chờ đánh giá').first()).toBeVisible();

    // Tab 6 (release): StandardVehicleHandoverModal opens and signature <canvas> has touch-none
    mockWoStatus = 'FINANCIAL_CLEARED';
    await page.goto('http://localhost:3001/advisor/work-orders/101?tab=release', { waitUntil: 'domcontentloaded' });
    const handoverBtn = page.getByRole('button', { name: /Lập biên bản bàn giao xe/ });
    await expect(handoverBtn).toBeVisible({ timeout: 20000 });
    await handoverBtn.click();

    const signatureCanvas = page.locator('canvas.touch-none');
    await expect(signatureCanvas).toBeVisible();
    await expect(signatureCanvas).toHaveClass(/touch-none/);
  });
});
