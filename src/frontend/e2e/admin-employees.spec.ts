import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

const MOCK_SKILLS = [
  { id: 1, name: 'Chẩn đoán OBD-II', is_active: true },
  { id: 2, name: 'Sửa chữa động cơ', is_active: true },
  { id: 3, name: 'Đồng sơn & Detailing', is_active: true },
];

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    fullName: 'Nguyễn Văn Kỹ Thuật',
    position: 'TECHNICIAN',
    isActive: true,
    user: {
      id: 10,
      email: 'tech1@autocare.vn',
      phone: '0901112222',
      isActive: true,
    },
    skills: [{ id: 1, name: 'Chẩn đoán OBD-II' }],
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 2,
    fullName: 'Trần Thị Cố Vấn',
    position: 'ADVISOR',
    isActive: true,
    user: {
      id: 20,
      email: 'advisor1@autocare.vn',
      phone: '0903334444',
      isActive: true,
    },
    skills: [],
    createdAt: '2026-11-02T08:00:00.000Z',
  },
  {
    id: 3,
    fullName: 'Lê Văn Tạm Ngưng',
    position: 'TECHNICIAN',
    isActive: false,
    user: null,
    skills: [{ id: 2, name: 'Sửa chữa động cơ' }],
    createdAt: '2026-11-03T08:00:00.000Z',
  },
];

const MOCK_USERS = [
  {
    id: 10,
    email: 'tech1@autocare.vn',
    fullName: 'Nguyễn Văn Kỹ Thuật',
    phone: '0901112222',
    isActive: true,
    roles: ['TECHNICIAN'],
    employee: { id: 1, position: 'TECHNICIAN' },
  },
  {
    id: 20,
    email: 'advisor1@autocare.vn',
    fullName: 'Trần Thị Cố Vấn',
    phone: '0903334444',
    isActive: true,
    roles: ['ADVISOR'],
    employee: { id: 2, position: 'ADVISOR' },
  },
  {
    id: 30,
    email: 'newtech@autocare.vn',
    fullName: 'Phạm Hoàng Mới',
    phone: '0909888777',
    isActive: true,
    roles: ['TECHNICIAN'],
    employee: null,
  },
];

test.describe('Admin Portal — Employees Management E2E (/employees) [TICKET-ADM-03]', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'admin@autocare.vn',
          fullName: 'Quản Trị Hệ Thống',
          roles: ['ADMIN'],
        })
      );
      localStorage.setItem('token', 'mock-admin-jwt-token');
    });

    // Fallback for any unintercepted API calls
    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.route('**/api/users**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: MOCK_USERS,
          pagination: { totalRecords: MOCK_USERS.length, totalPages: 1, currentPage: 1, limit: 100 },
        }),
      });
    });
  });

  test('E2E-ADM-EMP-01: Bento summary tiles toggle filterStatus, kết hợp search, filterPos và TablePagination', async ({
    page,
  }) => {
    const requestedQueries: string[] = [];

    await page.route('**/api/employees**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/skills')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: MOCK_SKILLS }),
        });
      }

      requestedQueries.push(url.search);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const position = url.searchParams.get('position') || '';
      const status = url.searchParams.get('status') || '';
      const pageNum = Number(url.searchParams.get('page') || '1');

      let filtered = [...INITIAL_EMPLOYEES];
      if (search) {
        filtered = filtered.filter((e) => e.fullName.toLowerCase().includes(search));
      }
      if (position) {
        filtered = filtered.filter((e) => e.position === position);
      }
      if (status === 'active') {
        filtered = filtered.filter((e) => e.isActive);
      } else if (status === 'inactive') {
        filtered = filtered.filter((e) => !e.isActive);
      }

      // Simulate multi-page pagination when no filter is active
      const totalRecords = !search && !position && !status ? 15 : filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalRecords / 10));

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: filtered,
          pagination: {
            totalRecords,
            totalPages,
            currentPage: pageNum,
            limit: 10,
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Tổng nhân sự hệ thống')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible();
    await expect(page.locator('text=Lê Văn Tạm Ngưng')).toBeVisible();

    // 1. Click Bento Tile "Đang hoạt động" -> filterStatus = active
    await page.locator('div[title="Bấm để lọc danh sách đang hoạt động"]').click();
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible();
    await expect(page.locator('text=Lê Văn Tạm Ngưng')).toBeHidden();
    expect(requestedQueries.some((q) => q.includes('status=active'))).toBe(true);

    // 2. Click Bento Tile "Ngừng hoạt động" -> filterStatus = inactive
    await page.locator('div[title="Bấm để lọc danh sách ngừng hoạt động"]').click();
    await expect(page.locator('text=Lê Văn Tạm Ngưng')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeHidden();
    expect(requestedQueries.some((q) => q.includes('status=inactive'))).toBe(true);

    // Click again to clear filterStatus -> back to all (2 pages)
    await page.locator('div[title="Bấm để lọc danh sách ngừng hoạt động"]').click();
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible();

    // 3. Test TablePagination (click page 2)
    const page2Btn = page.locator('button[aria-label="Trang 2"]');
    await expect(page2Btn).toBeVisible();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/employees') && res.url().includes('page=2')),
      page2Btn.click(),
    ]);
    expect(requestedQueries.some((q) => q.includes('page=2'))).toBe(true);

    // 4. Filter by position dropdown + search input
    const posSelect = page.locator('select:has(option[value="ADVISOR"])').first();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/employees') && res.url().includes('position=ADVISOR')),
      posSelect.selectOption('ADVISOR'),
    ]);
    await expect(page.locator('text=Trần Thị Cố Vấn')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeHidden();
    expect(requestedQueries.some((q) => q.includes('position=ADVISOR'))).toBe(true);

    const searchInput = page.locator('input[placeholder="Tìm theo Họ tên nhân viên..."]');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/employees') && res.url().includes('search=')),
      searchInput.fill('Trần Thị'),
    ]);
    await expect(page.locator('text=Trần Thị Cố Vấn')).toBeVisible();
    expect(requestedQueries.some((q) => q.includes('search='))).toBe(true);
  });

  test('E2E-ADM-EMP-02: Mở EmployeeDetailModal, kiểm tra badge chức vụ, kỹ năng, IAM user và nút Chỉnh sửa hồ sơ', async ({
    page,
  }) => {
    let detailFetched = false;

    await page.route('**/api/employees**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/skills')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: MOCK_SKILLS }),
        });
      }
      if (/\/api\/employees\/\d+$/.test(url.pathname)) {
        detailFetched = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              ...INITIAL_EMPLOYEES[0],
              user: {
                id: 10,
                email: 'tech1@autocare.vn',
                phone: '0901112222',
                isActive: true,
                address: 'Quận 7, TP.HCM',
                roles: ['TECHNICIAN'],
              },
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_EMPLOYEES,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible({ timeout: 20000 });

    await page.locator('button[title="Xem chi tiết nhân viên"]').first().click();

    await expect(page.locator('h2:has-text("Hồ sơ Chi tiết Nhân viên")')).toBeVisible();
    expect(detailFetched).toBe(true);
    await expect(page.locator('text=EMP-0001').first()).toBeVisible();
    await expect(page.locator('text=tech1@autocare.vn').last()).toBeVisible();
    await expect(page.locator('a[href="/accounts?search=tech1%40autocare.vn"]')).toBeVisible();
    await expect(page.locator('text=Chẩn đoán OBD-II').last()).toBeVisible();

    // Click "Chỉnh sửa hồ sơ" chuyển sang Edit Modal
    await page.locator('button:has-text("Chỉnh sửa hồ sơ")').click();
    await expect(page.locator('h2:has-text("Cập nhật nhân viên")')).toBeVisible();
  });

  test('E2E-ADM-EMP-03: Create/Edit nhân viên — ComboBox link/unlink userId & ẩn/hiện skillIds theo role', async ({
    page,
  }) => {
    let createPayload: any = null;
    let updatePayload: any = null;

    await page.route('**/api/employees**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname.endsWith('/skills')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: MOCK_SKILLS }),
        });
      }

      if (method === 'POST') {
        createPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Tạo nhân viên thành công',
            data: { id: 99, ...createPayload },
          }),
        });
      }

      if (method === 'PUT' && /\/api\/employees\/\d+$/.test(url.pathname)) {
        updatePayload = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Cập nhật nhân viên thành công',
            data: { id: 1, ...updatePayload },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_EMPLOYEES,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible({ timeout: 20000 });

    // 1. Create Modal: kiểm tra ẩn/hiện skillIds khi đổi role & chọn userId qua ComboBox
    await page.locator('button:has-text("Thêm nhân viên")').click();
    await expect(page.locator('h2:has-text("Thêm nhân viên")')).toBeVisible();

    await page.locator('input[placeholder="Nguyễn Văn A"]').fill('Phạm Hoàng Mới');

    // Mặc định TECHNICIAN -> hiện Kỹ năng chuyên môn
    await expect(page.locator('text=Kỹ năng chuyên môn')).toBeVisible();

    // Đổi sang ADVISOR -> ẩn skillIds, hiện thông báo không áp dụng
    const modalRoleSelect = page.locator('form select');
    await modalRoleSelect.selectOption('ADVISOR');
    await expect(page.locator('text=không áp dụng kỹ năng kỹ thuật')).toBeVisible();
    await expect(page.locator('text=Kỹ năng chuyên môn')).toBeHidden();

    // Đổi sang DETAILER -> hiện lại skillIds & chọn skill
    await modalRoleSelect.selectOption('DETAILER');
    await expect(page.locator('text=Kỹ năng chuyên môn')).toBeVisible();
    await page.locator('form button:has-text("Đồng sơn & Detailing")').click();

    // Chọn tài khoản chưa liên kết qua ComboBox
    const comboInput = page.locator('input[placeholder="Tìm theo email hoặc họ tên tài khoản..."]');
    await comboInput.click();
    await page.locator('li:has-text("newtech@autocare.vn")').click();

    await page.locator('form button:has-text("Lưu lại")').click();
    await expect(page.locator('h2:has-text("Thêm nhân viên")')).toBeHidden();
    expect(createPayload).toEqual({
      fullName: 'Phạm Hoàng Mới',
      position: 'DETAILER',
      userId: 30,
      skillIds: [3],
    });

    // 2. Edit Modal: gỡ liên kết tài khoản bằng nút "Gỡ tài khoản"
    await page.locator('button[title="Chỉnh sửa"]').first().click();
    await expect(page.locator('h2:has-text("Cập nhật nhân viên")')).toBeVisible();
    await page.locator('button:has-text("Gỡ tài khoản")').click();
    await expect(page.locator('text=sẽ được gỡ khỏi nhân viên sau khi bạn nhấn')).toBeVisible();

    await page.locator('form button:has-text("Cập nhật")').click();
    await expect(page.locator('h2:has-text("Cập nhật nhân viên")')).toBeHidden();
    expect(updatePayload).toMatchObject({
      fullName: 'Nguyễn Văn Kỹ Thuật',
      position: 'TECHNICIAN',
      userId: null,
    });
  });

  test('E2E-ADM-EMP-04: Deactivate gặp lỗi guardrail 400 hiển thị thông báo rõ ràng & Reactivate thành công', async ({
    page,
  }) => {
    let reactivatedId: string | null = null;
    const guardrailMessage =
      'Không thể ngừng hoạt động nhân sự vì nhân viên đang được phân công 1 công việc chưa hoàn thành: "Thay má phanh trước" (WO-202611-001).';

    await page.route('**/api/employees**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname.endsWith('/skills')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: MOCK_SKILLS }),
        });
      }

      if (method === 'DELETE' && /\/api\/employees\/\d+$/.test(url.pathname)) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: guardrailMessage,
          }),
        });
      }

      if (method === 'PATCH' && /\/api\/employees\/\d+\/reactivate$/.test(url.pathname)) {
        reactivatedId = url.pathname.split('/')[3];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Khôi phục nhân viên thành công',
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: INITIAL_EMPLOYEES,
          pagination: { totalRecords: 3, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Nguyễn Văn Kỹ Thuật')).toBeVisible({ timeout: 20000 });

    // 1. Deactivate gặp lỗi 400 -> hiển thị toast lỗi guardrail
    await page.locator('button[title="Vô hiệu hóa"]').first().click();
    await expect(page.locator('h2:has-text("Vô hiệu hóa nhân viên")')).toBeVisible();
    await page.locator('button:has-text("Vô hiệu hóa")').last().click();

    await expect(page.locator(`text=${guardrailMessage}`)).toBeVisible({ timeout: 10000 });

    // 2. Reactivate nhân viên đang ngừng hoạt động
    await page.locator('button[title="Kích hoạt lại"]').first().click();
    await expect(page.locator('h2:has-text("Kích hoạt lại nhân viên")')).toBeVisible();
    await page.locator('button:has-text("Kích hoạt lại")').last().click();

    expect(reactivatedId).toBe('3');
    await expect(page.locator('text=Đã kích hoạt lại nhân viên "Lê Văn Tạm Ngưng" thành công')).toBeVisible({
      timeout: 10000,
    });
  });
});
