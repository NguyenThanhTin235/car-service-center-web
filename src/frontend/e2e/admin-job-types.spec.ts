import { test, expect } from '@playwright/test';

test.describe('Admin Portal E2E: Job Types (/job-types)', () => {
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

    await page.route('**/api/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'success',
          data: [],
          pagination: { totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 },
        }),
      });
    });
  });

  test('E2E-ADM-JOBT-01: Tìm kiếm và phân trang danh sách loại công việc', async ({ page }) => {
    const page1Items = [
      { id: 1, name: 'Thay dầu động cơ', description: 'Bảo dưỡng định kỳ', isActive: true },
      { id: 2, name: 'Kiểm tra hệ thống phanh', description: 'Phanh đĩa & tang trống', isActive: true },
    ];
    const page2Items = [
      { id: 11, name: 'Cân chỉnh thước lái', description: 'Góc đặt bánh xe', isActive: false },
    ];

    await page.route('**/api/job-types**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search') || '';
      const currentPage = parseInt(url.searchParams.get('page') || '1', 10);

      if (search.includes('phanh')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: [page1Items[1]],
            pagination: { totalRecords: 1, totalPages: 1, currentPage: 1, limit: 10 },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: currentPage === 2 ? page2Items : page1Items,
          pagination: { totalRecords: 11, totalPages: 2, currentPage, limit: 10 },
        }),
      });
    });

    await page.goto('http://localhost:3001/job-types', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Thay dầu động cơ')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=JT-001')).toBeVisible();

    // Phân trang sang trang 2
    await page.locator('button:has-text("2")').first().click();
    await expect(page.locator('text=Cân chỉnh thước lái')).toBeVisible();
    await expect(page.locator('text=JT-011')).toBeVisible();

    // Tìm kiếm
    await page.fill('#search-job-type', 'phanh');
    await expect(page.locator('text=Kiểm tra hệ thống phanh')).toBeVisible();
    await expect(page.locator('text=Thay dầu động cơ')).not.toBeVisible();
  });

  test('E2E-ADM-JOBT-02: Tạo mới và chỉnh sửa loại công việc', async ({ page }) => {
    let items = [
      { id: 1, name: 'Thay dầu động cơ', description: 'Định kỳ 5.000km', isActive: true },
    ];

    await page.route('**/api/job-types**', async (route) => {
      const req = route.request();
      const method = req.method();

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: items,
            pagination: { totalRecords: items.length, totalPages: 1, currentPage: 1, limit: 10 },
          }),
        });
      }

      if (method === 'POST') {
        const body = req.postDataJSON();
        const created = { id: 2, name: body.name, description: body.description || '', isActive: true };
        items = [...items, created];
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Tạo loại công việc thành công',
            data: created,
          }),
        });
      }

      if (method === 'PUT') {
        const body = req.postDataJSON();
        items = items.map((it) =>
          it.id === 2 ? { ...it, name: body.name, description: body.description || '' } : it
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Cập nhật loại công việc thành công',
            data: items.find((it) => it.id === 2),
          }),
        });
      }

      return route.continue();
    });

    await page.goto('http://localhost:3001/job-types', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Thay dầu động cơ')).toBeVisible({ timeout: 15000 });

    // Tạo mới
    await page.click('#btn-add-job-type');
    await expect(page.locator('h2:has-text("Thêm loại công việc")')).toBeVisible();
    await page.fill('#input-jt-name', 'Vệ sinh kim phun');
    await page.fill('#input-jt-description', 'Làm sạch buồng đốt');
    await page.click('#btn-submit-form');

    await expect(page.locator('text=Vệ sinh kim phun')).toBeVisible();

    // Chỉnh sửa
    await page.click('#btn-edit-jt-2');
    await expect(page.locator('h2:has-text("Cập nhật loại công việc")')).toBeVisible();
    await page.fill('#input-jt-name', 'Vệ sinh kim phun xăng điện tử');
    await page.click('#btn-submit-form');

    await expect(page.locator('text=Vệ sinh kim phun xăng điện tử')).toBeVisible();
  });

  test('E2E-ADM-JOBT-03: Toggle active & Delete qua ConfirmModal (bao gồm lỗi 400 khi đang được sử dụng)', async ({
    page,
  }) => {
    let items = [
      { id: 1, name: 'Sửa chữa động cơ', description: 'Đang dùng', isActive: true },
      { id: 2, name: 'Loại công việc nháp', description: 'Chưa dùng', isActive: true },
    ];

    await page.route('**/api/job-types**', async (route) => {
      const req = route.request();
      const method = req.method();
      const url = req.url();

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: items,
            pagination: { totalRecords: items.length, totalPages: 1, currentPage: 1, limit: 10 },
          }),
        });
      }

      if (method === 'PATCH' && url.includes('/1/toggle')) {
        items = items.map((it) => (it.id === 1 ? { ...it, isActive: !it.isActive } : it));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { isActive: items[0].isActive },
          }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/1')) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Không thể xóa loại công việc "Sửa chữa động cơ" vì đang được sử dụng bởi: 2 mẫu công việc.',
          }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/2')) {
        items = items.filter((it) => it.id !== 2);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Xóa loại công việc thành công',
          }),
        });
      }

      return route.continue();
    });

    await page.goto('http://localhost:3001/job-types', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Sửa chữa động cơ')).toBeVisible({ timeout: 15000 });

    // Toggle active -> Ngừng hoạt động
    await page.click('#btn-toggle-jt-1');
    await expect(page.locator('h2:has-text("Ngừng hoạt động loại công việc")')).toBeVisible();
    await page.locator('button:has-text("Ngừng hoạt động")').last().click();
    await expect(page.locator('span:has-text("Ngừng hoạt động")').first()).toBeVisible();

    // Delete item đang được sử dụng -> 400 error toast
    await page.click('#btn-delete-jt-1');
    await expect(page.locator('h2:has-text("Xóa loại công việc")')).toBeVisible();
    await page.locator('button:has-text("Xóa")').last().click();
    await expect(
      page.locator('text=Không thể xóa loại công việc "Sửa chữa động cơ"')
    ).toBeVisible();

    // Delete item chưa sử dụng -> 200 thành công
    await page.click('#btn-delete-jt-2');
    await page.locator('button:has-text("Xóa")').last().click();
    await expect(page.getByText('Loại công việc nháp', { exact: true })).not.toBeVisible();
  });
});
