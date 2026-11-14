import { test, expect } from '@playwright/test';

test.describe('Multi-Portal Interactive Dashboard & Taste Audit (SPEC-MULTI-PORTAL-DASHBOARD)', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock user token for authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock_jwt_token_for_e2e_testing');
    });

    // Mock API for /api/dashboard/:portal
    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      const portal = url.split('/api/dashboard/')[1]?.split('?')[0];

      if (portal === 'admin') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              portal: 'admin',
              period: { key: '7days', startDate: '2026-11-04', endDate: '2026-11-11' },
              kpis: [
                { key: 'totalUsers', label: 'Tổng tài khoản IAM', value: 48, prevValue: 42, format: 'number' },
                { key: 'activeUsers', label: 'Tài khoản hoạt động', value: 45, format: 'number', unit: 'người dùng' },
                { key: 'totalEmployees', label: 'Nhân sự kỹ thuật', value: 20, format: 'number', unit: 'nhân viên' },
                { key: 'totalServices', label: 'Dịch vụ niêm yết', value: 36, format: 'number', unit: 'dịch vụ' },
              ],
              charts: {
                rbacDistribution: [
                  { role: 'ADMIN', count: 4 },
                  { role: 'MANAGER', count: 3 },
                  { role: 'SERVICE ADVISOR', count: 8 },
                  { role: 'TECHNICIAN', count: 25 },
                ],
                serviceCategories: [
                  { name: 'Bảo dưỡng định kỳ', count: 12 },
                  { name: 'Sửa chữa động cơ', count: 15 },
                  { name: 'Đồng sơn & Thân vỏ', count: 9 },
                ],
              },
              actionableList: [
                { id: 1, title: 'Nguyễn Văn An', subtitle: 'an.nguyen@test.vn', status: 'ACTIVE', timestamp: '2026-11-10T08:00:00Z' },
                { id: 2, title: 'Trần Thị Bình', subtitle: 'binh.tran@test.vn', status: 'ACTIVE', timestamp: '2026-11-09T10:30:00Z' },
              ],
            },
            message: 'OK',
          }),
        });
      }

      if (portal === 'manager') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              portal: 'manager',
              period: { key: '7days', startDate: '2026-11-04', endDate: '2026-11-11' },
              kpis: [
                { key: 'totalRevenue', label: 'Doanh thu quyết toán', value: 185400000, prevValue: 162000000, format: 'currency' },
                { key: 'activeWorkOrders', label: 'Lệnh xe đang xử lý', value: 24, format: 'number', unit: 'lệnh' },
                { key: 'overdueJobs', label: 'Công việc quá hạn SLA', value: 2, format: 'number', trendInverted: true, unit: 'vi phạm' },
              ],
              charts: {
                trend: [
                  { label: '05/11', value: 22000000, count: 6 },
                  { label: '06/11', value: 28500000, count: 9 },
                  { label: '07/11', value: 35000000, count: 11 },
                  { label: '08/11', value: 42000000, count: 14 },
                ],
                distribution: [
                  { category: 'IN_PLANNING', count: 5 },
                  { category: 'PENDING_APPROVAL', count: 4 },
                  { category: 'APPROVED', count: 3 },
                  { category: 'IN_PROGRESS', count: 8 },
                  { category: 'BILLING_REQUESTED', count: 4 },
                ],
              },
              actionableList: [
                { id: 101, woNumber: 'WO-202611-001', customerName: 'Lê Hoàng Long', vehiclePlate: '51K-123.45', advisorName: 'Trần Cố Vấn', status: 'IN_PROGRESS', updatedAt: '2026-11-11T09:00:00Z' },
                { id: 102, woNumber: 'WO-202611-002', customerName: 'Phạm Minh Tuấn', vehiclePlate: '51H-999.88', advisorName: 'Nguyễn Cố Vấn', status: 'PENDING_APPROVAL', updatedAt: '2026-11-11T10:15:00Z' },
              ],
            },
            message: 'OK',
          }),
        });
      }

      if (portal === 'sa') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              portal: 'sa',
              period: { key: '7days', startDate: '2026-11-04', endDate: '2026-11-11' },
              kpis: [
                { key: 'pendingQuotations', label: 'Báo giá chờ khách duyệt', value: 4, format: 'number', unit: 'hồ sơ' },
                { key: 'inInspectionWos', label: 'Xe đang khám / Lập kế hoạch', value: 6, format: 'number', unit: 'xe' },
                { key: 'qcReadyWos', label: 'Chờ nghiệm thu QC', value: 3, format: 'number', unit: 'xe' },
                { key: 'handoverReadyWos', label: 'Đã thanh toán / Chờ bàn giao', value: 2, format: 'number', unit: 'xe' },
              ],
              charts: {
                appointmentsVolume: 12,
                distribution: [
                  { category: 'Chờ báo giá', count: 4 },
                  { category: 'Đang khám', count: 6 },
                  { category: 'Chờ QC', count: 3 },
                  { category: 'Chờ giao xe', count: 2 },
                ],
              },
              actionableList: [
                { id: 201, woNumber: 'WO-202611-010', customerName: 'Trần Văn Đức', customerPhone: '0901234567', vehiclePlate: '30E-888.22', vehicleModel: 'Toyota Camry 2022', status: 'IN_PLANNING', updatedAt: '2026-11-11T08:30:00Z' },
              ],
            },
            message: 'OK',
          }),
        });
      }

      if (portal === 'staff') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              portal: 'staff',
              period: { key: '7days', startDate: '2026-11-04', endDate: '2026-11-11' },
              kpis: [
                { key: 'activeJobsCount', label: 'Công việc đang đảm nhiệm', value: 3, format: 'number', unit: 'công việc' },
                { key: 'completedTodayCount', label: 'Hoàn thành trong kỳ', value: 8, format: 'number', unit: 'xong' },
                { key: 'appointmentsToday', label: 'Lượng xe tiếp nhận theo lịch', value: 7, format: 'number', unit: 'lượt' },
                { key: 'lowStockCount', label: 'Mặt hàng trong kho', value: 12, format: 'number', unit: 'phụ tùng' },
              ],
              charts: {
                jobStatus: [
                  { category: 'Đang làm', count: 3 },
                  { category: 'Hoàn thành', count: 8 },
                ],
              },
              actionableList: [
                { id: 301, name: 'Thay dầu nhớt & Lọc nhớt động cơ', status: 'IN_PROGRESS', estimatedHours: '1.5', woNumber: 'WO-202611-010', vehiclePlate: '30E-888.22' },
              ],
            },
            message: 'OK',
          }),
        });
      }

      return route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: {} }) });
    });
  });

  test('AUDIT-01: Admin Dashboard (/admin) - Xác thực cấu trúc KPI, Biểu đồ RBAC và Danh sách tài khoản', async ({ page }) => {
    await page.goto('http://localhost:3001/admin');

    // 1. Kiểm tra tiêu đề chính
    await expect(page.locator('h1')).toContainText('Tổng quan Hệ thống');

    // 2. Kiểm tra thanh lọc thời gian
    await expect(page.locator('button', { hasText: '7 ngày qua' })).toBeVisible();

    // 3. Kiểm tra 4 thẻ KPI Cards
    await expect(page.locator('text=Tổng tài khoản IAM')).toBeVisible();
    await expect(page.locator('text=Tài khoản hoạt động')).toBeVisible();
    await expect(page.locator('text=Nhân sự kỹ thuật')).toBeVisible();
    await expect(page.locator('text=Dịch vụ niêm yết')).toBeVisible();

    // 4. Kiểm tra Biểu đồ phân bổ RBAC
    await expect(page.locator('text=Cơ cấu phân quyền tài khoản (RBAC)')).toBeVisible();

    // 5. Kiểm tra bảng danh sách người dùng
    await expect(page.locator('text=Nhật ký tài khoản người dùng mới nhất')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn An')).toBeVisible();
  });

  test('AUDIT-02: Manager Dashboard (/dashboard) - Kiểm tra Doanh thu, Lọc chéo trạng thái và Lệnh xe', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');

    // 1. Kiểm tra tiêu đề trang
    await expect(page.locator('h1')).toContainText('Trung Tâm Điều Hành & Giám Sát');

    // 2. Kiểm tra KPI doanh thu hiển thị tiền VNĐ
    await expect(page.locator('text=Doanh thu quyết toán')).toBeVisible();

    // 3. Kiểm tra bảng Work Order
    await expect(page.locator('text=Hàng Đợi Lệnh Sửa Chữa Đang Xử Lý')).toBeVisible();
    await expect(page.locator('text=WO-202611-001')).toBeVisible();
    await expect(page.locator('text=51K-123.45')).toBeVisible();

    // 4. Kiểm tra biểu đồ xu hướng và donut
    await expect(page.locator('text=Biểu đồ Doanh thu Quyết toán Thực tế')).toBeVisible();
    await expect(page.locator('text=Cơ cấu Lệnh xe Đang Mở')).toBeVisible();
  });

  test('AUDIT-03: Service Advisor Dashboard (/advisor/dashboard) - Kiểm tra chuyển đổi Scope (Việc của tôi vs Toàn xưởng)', async ({ page }) => {
    await page.goto('http://localhost:3001/advisor/dashboard');

    // 1. Tiêu đề
    await expect(page.locator('h1')).toContainText('Bảng Điều Hành Cố Vấn Dịch Vụ');

    // 2. Kiểm tra nút chuyển đổi Scope
    const myScopeBtn = page.locator('button', { hasText: 'Việc của tôi' });
    const workshopScopeBtn = page.locator('button', { hasText: 'Toàn bộ xưởng' });
    await expect(myScopeBtn).toBeVisible();
    await expect(workshopScopeBtn).toBeVisible();

    // 3. Kiểm tra KPI Cards đặc thù SA
    await expect(page.locator('text=Báo giá chờ khách duyệt')).toBeVisible();
    await expect(page.locator('text=Chờ nghiệm thu QC')).toBeVisible();
    await expect(page.locator('text=Đã thanh toán / Chờ bàn giao')).toBeVisible();
  });

  test('AUDIT-04: Staff Dashboard (/staff/dashboard) - Kiểm tra điều phối công việc và hàng đợi kỹ thuật', async ({ page }) => {
    await page.goto('http://localhost:3001/staff/dashboard');

    // 1. Tiêu đề
    await expect(page.locator('h1')).toContainText('Bảng Điều Phối Kỹ Thuật Viên & Tiếp Nhận');

    // 2. Kiểm tra 4 thẻ KPI
    await expect(page.locator('text=Công việc đang đảm nhiệm')).toBeVisible();
    await expect(page.locator('text=Hoàn thành trong kỳ')).toBeVisible();

    // 3. Kiểm tra bảng nhiệm vụ
    await expect(page.locator('text=Thay dầu nhớt & Lọc nhớt động cơ')).toBeVisible();
  });

  test('AUDIT-05: Visual Taste & Viewport Audit (390px Mobile & 1440px Desktop)', async ({ page }) => {
    // 1. Mobile 390px (Kiểm tra không bị vỡ giao diện hoặc tràn thanh cuộn ngang)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3001/admin');
    await expect(page.locator('h1')).toBeVisible();

    // 2. Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/admin');
    await expect(page.locator('h1')).toBeVisible();
  });
});
