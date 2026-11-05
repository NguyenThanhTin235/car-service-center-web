import { test, expect } from '@playwright/test';

test.describe('E2E Sprint 3: Internal Advisor Work Order & AI Job Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // 0. Global fallback for any unintercepted /api/** calls to prevent 401 redirects from live backend
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

    // Intercept auth login for Internal Web
    await page.route('**/api/auth/login', async (route) => {
      const requestData = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Đăng nhập thành công',
          data: {
            user: {
              id: 2,
              email: requestData.email || 'advisor@autocare.vn',
              fullName: 'Trần Cố Vấn',
              roles: ['SA'],
            },
            token: 'mock-sa-jwt-token-998877',
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
            id: 2,
            fullName: 'Trần Cố Vấn',
            roles: ['SA'],
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept work orders list
    await page.route(/\/api\/work-orders(\?.*)?$/, async (route) => {
      const url = route.request().url();
      // If it is asking for a specific ID e.g. /api/work-orders/101, let the specific route handle it
      if (url.match(/\/api\/work-orders\/\d+/)) {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Lấy danh sách phiếu thành công',
          data: [
            {
              id: 101,
              wo_number: 'WO-261018-001',
              status: 'IN_PLANNING',
              created_at: new Date().toISOString(),
              customer: { full_name: 'Nguyễn Văn Khách', phone: '0901234567' },
              vehicle: { license_plate: '51A-999.99', make: 'Honda', model: 'CR-V', vehicle_size: 'LARGE' },
              advisor: { full_name: 'Trần Cố Vấn' },
            },
          ],
          meta: {
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept intake queue list
    await page.route('**/api/intake-queue**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Lấy hàng đợi thành công',
          data: [
            {
              id: 55,
              intake_type: 'WALK_IN',
              status: 'QUEUED',
              arrived_at: new Date(Date.now() - 15 * 60000).toISOString(),
              notes: 'Kiểm tra hệ thống phanh và bảo dưỡng định kỳ',
              customer: { id: 1, full_name: 'Nguyễn Văn Khách', phone: '0901234567', email: 'khach@example.com' },
              vehicle: { id: 10, license_plate: '51A-999.99', make: 'Honda', model: 'CR-V', year: 2022, color: 'Trắng', vehicle_size: 'LARGE' },
              created_by: { id: 3, full_name: 'Lễ Tân Minh' },
              services: [{ id: 1, service: { id: 10, name: 'Bảo dưỡng định kỳ', category: { name: 'Bảo dưỡng' } } }],
              work_order: null,
            },
          ],
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept single work order detail
    await page.route('**/api/work-orders/101', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Lấy thông tin phiếu công việc thành công',
          data: {
            id: 101,
            wo_number: 'WO-261018-001',
            status: 'IN_PLANNING',
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
              mileage: 121,
              fuel_level: 50,
              exterior_condition: 'Bình thường',
              belongings: 'KKKKKK',
              evidence_urls: [],
              complaint: JSON.stringify({ tags: ['Điều hòa không lạnh'], notes: 'Không có ghi chú.' }),
              intake_cost_estimate: 5120000,
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
                  },
                ],
              },
            ],
            inspections: [],
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept inspection endpoint
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
            findings: [],
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept parts endpoint
    await page.route('**/api/work-orders/101/parts**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [],
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept QC endpoint
    await page.route('**/api/work-orders/101/qc**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            stats: {
              progressPercent: 0,
              passedServices: 0,
              totalServices: 1,
              passedJobs: 0,
              totalJobs: 1,
              reworkJobs: 0,
              canRequestBilling: false,
              isBillingRequested: false,
            },
            services: [],
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept work order quotations
    await page.route('**/api/work-orders/101/quotations**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [
            {
              id: 301,
              quotation_number: 'QUO-WO-261018-001-01',
              status: 'DRAFT',
              grandTotal: 5120000,
            },
          ],
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept employees
    await page.route('**/api/employees**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [
            {
              id: 12,
              fullName: 'Hồ Văn Lâm',
              position: 'TECHNICIAN',
              isActive: true,
            },
          ],
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept services
    await page.route('**/api/services**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: [],
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept AI job suggestions endpoint
    await page.route('**/api/work-orders/101/ai-job-suggestions*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Tạo đề xuất công việc thành công',
          data: {
            summary: 'Đề xuất xử lý mã lỗi P0300 động cơ bỏ máy và bảo dưỡng bugi',
            confidence_score: 95,
            total_estimated_hours: 2.5,
            critical_findings_count: 0,
            available_technicians: [
              {
                id: 12,
                full_name: 'Hồ Văn Lâm',
                skills: ['Điện', 'Động cơ'],
                active_jobs_count: 1,
                today_assigned_hours: 2.0,
                status: 'AVAILABLE',
              },
            ],
            suggested_services: [
              {
                service_id: 501,
                service_name: 'Sửa chữa động cơ bỏ máy',
                category_type: 'REPAIR',
                is_existing_service: true,
                jobs: [
                  {
                    name: 'Chẩn đoán lỗi OBD-II',
                    description: 'Kết nối máy chẩn đoán đọc mã lỗi hệ thống động cơ',
                    job_type_id: 1,
                    job_type_name: 'Sửa chữa điện - điện tử',
                    estimated_hours: 1.0,
                    severity: 'HIGH',
                    is_already_exist: true, // Existing on ticket!
                    assigned_technician_id: 12,
                    assigned_technician_name: 'Hồ Văn Lâm',
                  },
                  {
                    name: 'Tháo và thay bugi',
                    description: 'Tháo cụm bugi đánh lửa để kiểm tra điện cực và thay thế',
                    job_type_id: 2,
                    job_type_name: 'Sửa chữa cơ khí',
                    estimated_hours: 1.0,
                    severity: 'MEDIUM',
                    is_already_exist: false, // New proposed job
                    assigned_technician_id: 12,
                    assigned_technician_name: 'Hồ Văn Lâm',
                  },
                ],
              },
            ],
          },
          timestamp: Date.now(),
        }),
      });
    });

    // Intercept applying AI jobs
    await page.route('**/api/work-orders/101/apply-ai-jobs', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Đã thêm 1 công việc vào phiếu',
          data: {
            applied_jobs_count: 1,
          },
          timestamp: Date.now(),
        }),
      });
    });
  });

  test('UC-44 & UC-05: Service Advisor login and dashboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3001/login');

    await expect(page.locator('h1')).toContainText('Đăng nhập');

    // Fill SA credentials
    await page.fill('input[name="email"]', 'advisor@autocare.vn');
    await page.fill('input[name="password"]', 'Advisor@2026');
    await page.click('button[type="submit"]');

    // Should redirect to /advisor dashboard
    await expect(page).toHaveURL(/.*\/advisor/, { timeout: 10000 });
    await expect(page.locator('text=Xem hàng đợi')).toBeVisible();
  });

  test('UC-16 & UC-18: Service Advisor Work Order Tab Management', async ({ page }) => {
    // Inject pre-authenticated SA state
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 2,
          email: 'advisor@autocare.vn',
          fullName: 'Trần Cố Vấn',
          roles: ['SA'],
        })
      );
      localStorage.setItem('token', 'mock-sa-jwt-token-998877');
    });

    await page.goto('http://localhost:3001/advisor/work-orders/101');

    // Verify WO Header & Badge Bar
    await expect(page.locator('text=WO-261018-001').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=51A-999.99').first()).toBeVisible();

    // Verify Tab 1: Tiếp nhận & Kiểm tra
    await expect(page.locator('button:has-text("Tiếp nhận & Kiểm tra")')).toBeVisible();

    // Navigate to Tab 2: Hạng mục sửa chữa
    const tabJobButton = page.locator('button:has-text("Hạng mục sửa chữa")');
    await expect(tabJobButton).toBeVisible();
    await tabJobButton.click();

    // Verify Service Category and existing Job
    await expect(page.locator('text=Sửa chữa động cơ bỏ máy')).toBeVisible();
    await expect(page.locator('text=Chẩn đoán lỗi OBD-II')).toBeVisible();
  });

  test('UC-72 & UC-18: AI Job Planner with anti-duplication detection and apply flow', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 2,
          email: 'advisor@autocare.vn',
          fullName: 'Trần Cố Vấn',
          roles: ['SA'],
        })
      );
      localStorage.setItem('token', 'mock-sa-jwt-token-998877');
    });

    await page.goto('http://localhost:3001/advisor/work-orders/101');

    // Switch to Tab 2 (Hạng mục sửa chữa)
    await page.click('button:has-text("Hạng mục sửa chữa")');

    // Find and click "AI gợi ý việc" button
    const aiSuggestBtn = page.locator('button:has-text("AI gợi ý việc")');
    await expect(aiSuggestBtn).toBeVisible({ timeout: 10000 });
    await aiSuggestBtn.click();

    // Verify AI Job Planner modal opened
    await expect(page.locator('text=Đã có trên phiếu').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tháo và thay bugi')).toBeVisible();

    // The existing job "Chẩn đoán lỗi OBD-II" should display "Đã có trên phiếu" badge
    const existingBadge = page.locator('text=Đã có trên phiếu').first();
    await expect(existingBadge).toBeVisible();

    // Click "Áp dụng vào Phiếu" button
    const applyButton = page.locator('button:has-text("Áp dụng")');
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    // Verify success toast feedback
    await expect(page.locator('text=Đã thêm 1 công việc vào phiếu')).toBeVisible({ timeout: 10000 });
  });

  test('SA Portal Bento Redesign: 3-Tone Hero Cards, Clean WO Detail & 5-Viewport Responsive Verification', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 2,
          email: 'advisor@autocare.vn',
          fullName: 'Trần Cố Vấn',
          roles: ['SA'],
        })
      );
      localStorage.setItem('token', 'mock-sa-jwt-token-998877');
    });

    // 1. Check /advisor Bento Dashboard uses real API data and 3-Tone Hero Cards
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/advisor');

    await expect(page.getByTestId('sa-hero-bento-grid')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('sa-icon-rail')).toBeVisible();
    await expect(page.locator('text=WO-261018-001').first()).toBeVisible();
    await expect(page.locator('text=RO-2309-001')).toHaveCount(0); // Old fake hardcoded row removed

    // 2. Check /advisor/work-orders/101 has removed fake sections (WOStatusControl, ChatterSidebar, fake membership)
    await page.goto('http://localhost:3001/advisor/work-orders/101');
    await expect(page.getByTestId('wo-detail-hero-grid')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Yêu cầu BH')).toHaveCount(0);
    await expect(page.locator('text=Sarah Jenkins')).toHaveCount(0);
    await expect(page.locator('text=Premium 10k svc')).toHaveCount(0);

    // 3. Verify 5 Viewports have zero horizontal overflow
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'tablet-large-touch', width: 1440, height: 960 },
      { name: 'desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(hasOverflow, `Viewport ${vp.name} (${vp.width}x${vp.height}) should not overflow horizontally`).toBe(false);
    }
  });
});
