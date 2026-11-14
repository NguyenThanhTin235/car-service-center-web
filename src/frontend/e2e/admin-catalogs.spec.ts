import { test, expect } from '@playwright/test';

const TYPE_COUNTS = {
  UOM: 2,
  CANCEL_REASON: 1,
  ADJUST_REASON: 1,
  TERMS: 1,
};

test.describe('Admin Portal E2E: System Catalogs (/catalogs)', () => {
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

  test('E2E-ADM-SYSCAT-01: Bento summary interactive filter tiles, dropdown filterType và search đồng bộ', async ({
    page,
  }) => {
    const allItems = [
      { id: 1, catalogType: 'UOM', name: 'Lít', description: 'Thể tích', isActive: true, sortOrder: 1 },
      { id: 2, catalogType: 'UOM', name: 'Cái', description: 'Đếm', isActive: true, sortOrder: 2 },
      { id: 3, catalogType: 'CANCEL_REASON', name: 'Khách bận đột xuất', description: '', isActive: true, sortOrder: 1 },
      { id: 4, catalogType: 'ADJUST_REASON', name: 'Kiểm kê định kỳ', description: '', isActive: true, sortOrder: 1 },
      { id: 5, catalogType: 'TERMS', name: 'Bảo hành 6 tháng', description: '', isActive: true, sortOrder: 1 },
    ];

    await page.route('**/api/*catalogs**', async (route) => {
      const url = new URL(route.request().url());
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const catalogType = url.searchParams.get('catalogType') || '';

      const filtered = allItems.filter((item) => {
        const matchType = !catalogType || item.catalogType === catalogType;
        const matchSearch = !search || item.name.toLowerCase().includes(search);
        return matchType && matchSearch;
      });

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: filtered,
          pagination: { totalRecords: filtered.length, totalPages: 1, currentPage: 1, limit: 10 },
          typeCounts: TYPE_COUNTS,
        }),
      });
    });

    await page.goto('http://localhost:3001/catalogs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=CAT-0001')).toBeVisible({ timeout: 15000 });

    // Click Bento tile "Lý do hủy"
    await page.locator('button:has-text("Lý do hủy")').click();
    await expect(page.locator('text=Khách bận đột xuất')).toBeVisible();
    await expect(page.locator('text=Lít')).not.toBeVisible();

    // Dropdown filterType đồng bộ thành CANCEL_REASON, đổi sang UOM
    const filterSelect = page.locator('select').first();
    await expect(filterSelect).toHaveValue('CANCEL_REASON');
    await filterSelect.selectOption('UOM');
    await expect(page.locator('text=Lít')).toBeVisible();
    await expect(page.locator('text=Khách bận đột xuất')).not.toBeVisible();

    // Search kết hợp
    await page.fill('input[placeholder="Tìm theo tên danh mục..."]', 'Cái');
    await expect(page.locator('text=Cái')).toBeVisible();
    await expect(page.locator('text=Lít')).not.toBeVisible();
  });

  test('E2E-ADM-SYSCAT-02: Tạo danh mục mới và chỉnh sửa (catalogType bị disabled khi edit)', async ({
    page,
  }) => {
    let items = [
      { id: 1, catalogType: 'UOM', name: 'Lít', description: 'Thể tích', isActive: true, sortOrder: 1 },
    ];

    await page.route('**/api/*catalogs**', async (route) => {
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
            typeCounts: TYPE_COUNTS,
          }),
        });
      }

      if (method === 'POST') {
        const body = req.postDataJSON();
        const created = {
          id: 10,
          catalogType: body.catalogType,
          name: body.name,
          description: body.description || '',
          sortOrder: body.sortOrder ?? 0,
          isActive: true,
        };
        items = [...items, created];
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: created }),
        });
      }

      if (method === 'PUT') {
        const body = req.postDataJSON();
        items = items.map((it) =>
          it.id === 10
            ? {
                ...it,
                name: body.name,
                description: body.description || '',
                sortOrder: body.sortOrder,
              }
            : it
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: items.find((it) => it.id === 10) }),
        });
      }

      return route.continue();
    });

    await page.goto('http://localhost:3001/catalogs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=CAT-0001')).toBeVisible({ timeout: 15000 });

    // Tạo mới
    await page.click('button:has-text("Thêm danh mục mới")');
    await expect(page.locator('h2:has-text("Thêm danh mục mới")')).toBeVisible();

    const modal = page.locator('form');
    await modal.locator('select').selectOption('TERMS');
    await modal.locator('input[type="number"]').fill('3');
    await modal.locator('input[placeholder*="Cái, Bộ"]').fill('Thanh toán ngay');
    await modal.locator('textarea').fill('Áp dụng tại quầy');
    await modal.locator('button[type="submit"]').click();

    await expect(page.getByText('Thanh toán ngay', { exact: true })).toBeVisible();

    // Chỉnh sửa: kiểm chứng catalogType disabled
    await page.locator('button[title="Chỉnh sửa"]').last().click();
    await expect(page.locator('h2:has-text("Cập nhật danh mục")')).toBeVisible();

    const editForm = page.locator('form');
    await expect(editForm.locator('select')).toBeDisabled();
    await editForm.locator('input[type="number"]').fill('5');
    await editForm.locator('input[placeholder*="Cái, Bộ"]').fill('Thanh toán chuyển khoản');
    await editForm.locator('button[type="submit"]').click();

    await expect(page.getByText('Thanh toán chuyển khoản', { exact: true })).toBeVisible();
  });

  test('E2E-ADM-SYSCAT-03: Toggle active & Delete qua ConfirmModal (bao gồm lỗi 400 khi đang được tham chiếu)', async ({
    page,
  }) => {
    let items = [
      { id: 1, catalogType: 'UOM', name: 'Lít', description: 'Đang liên kết', isActive: true, sortOrder: 1 },
      { id: 2, catalogType: 'UOM', name: 'Hộp nháp', description: 'Chưa liên kết', isActive: true, sortOrder: 2 },
    ];

    await page.route('**/api/*catalogs**', async (route) => {
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
            typeCounts: TYPE_COUNTS,
          }),
        });
      }

      if (method === 'PATCH' && url.includes('/1/toggle')) {
        items = items.map((it) => (it.id === 1 ? { ...it, isActive: !it.isActive } : it));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { isActive: items[0].isActive } }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/1')) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message:
              'Không thể xóa danh mục này do đã phát sinh liên kết dữ liệu trong hệ thống. Bạn có thể chọn vô hiệu hóa thay thế.',
          }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/2')) {
        items = items.filter((it) => it.id !== 2);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', message: 'Xóa danh mục thành công' }),
        });
      }

      return route.continue();
    });

    await page.goto('http://localhost:3001/catalogs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=CAT-0001')).toBeVisible({ timeout: 15000 });

    // Toggle active -> Vô hiệu hóa
    await page.locator('button[title="Vô hiệu hóa"]').first().click();
    await expect(page.locator('h2:has-text("Vô hiệu hóa danh mục")')).toBeVisible();
    await page.locator('button:has-text("Vô hiệu hóa")').last().click();
    await expect(page.locator('span:has-text("Vô hiệu")').first()).toBeVisible();

    // Delete item đang được tham chiếu -> 400 error toast
    await page.locator('button[title="Xóa danh mục"]').first().click();
    await expect(page.locator('h2:has-text("Xóa danh mục chung")')).toBeVisible();
    await page.locator('button:has-text("Xóa vĩnh viễn")').click();
    await expect(
      page.locator('text=Không thể xóa danh mục này do đã phát sinh liên kết dữ liệu trong hệ thống')
    ).toBeVisible();

    // Delete item chưa liên kết -> 200 thành công
    await page.locator('button[title="Xóa danh mục"]').last().click();
    await page.locator('button:has-text("Xóa vĩnh viễn")').click();
    await expect(page.getByText('Hộp nháp', { exact: true })).not.toBeVisible();
  });
});
