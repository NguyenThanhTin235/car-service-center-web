import { test, expect } from '@playwright/test';

test.describe('Admin Service Categories E2E (/service-categories) (TICKET-ADM-04)', () => {
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
        body: JSON.stringify({ status: 'success', success: true, data: [] }),
      });
    });
  });

  test('E2E-ADM-CAT-01: Tìm kiếm theo tên và phân trang danh sách nhóm dịch vụ', async ({ page }) => {
    const requestedUrls: string[] = [];

    await page.route('**/api/service-categories**', async (route) => {
      const url = new URL(route.request().url());
      requestedUrls.push(url.search);
      const search = url.searchParams.get('search') || '';
      const pageNum = Number(url.searchParams.get('page') || '1');

      if (search.includes('Đồng sơn')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: [
              {
                id: 12,
                name: 'Đồng sơn cao cấp',
                description: 'Sơn dặm và phục hồi thân vỏ',
                isActive: true,
                sortOrder: 12,
                templatesCount: 2,
              },
            ],
            pagination: { totalRecords: 1, totalPages: 1, currentPage: 1, limit: 10 },
          }),
        });
      }

      if (pageNum === 2) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: [
              {
                id: 11,
                name: 'Chăm sóc nội thất',
                description: 'Vệ sinh ghế da',
                isActive: true,
                sortOrder: 11,
                templatesCount: 1,
              },
            ],
            pagination: { totalRecords: 11, totalPages: 2, currentPage: 2, limit: 10 },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: 1,
              name: 'Bảo dưỡng định kỳ',
              description: 'Thay nhớt, lọc gió',
              isActive: true,
              sortOrder: 1,
              templatesCount: 5,
            },
          ],
          pagination: { totalRecords: 11, totalPages: 2, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/service-categories', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Bảo dưỡng định kỳ')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=CAT-001')).toBeVisible();

    // Phân trang sang trang 2
    const nextBtn = page.locator('button[aria-label="Trang sau"], button:has-text("2")').first();
    await nextBtn.click();
    await expect(page.locator('text=Chăm sóc nội thất')).toBeVisible();

    // Tìm kiếm theo tên
    const searchInput = page.getByPlaceholder('Tìm theo tên nhóm dịch vụ...');
    await searchInput.fill('Đồng sơn');
    await searchInput.press('Enter');

    await expect(page.locator('text=Đồng sơn cao cấp')).toBeVisible();
    expect(requestedUrls.some((q) => q.includes('search='))).toBe(true);
  });

  test('E2E-ADM-CAT-02: Tạo mới và chỉnh sửa nhóm dịch vụ (name, description, isActive)', async ({
    page,
  }) => {
    let categories = [
      {
        id: 1,
        name: 'Bảo dưỡng định kỳ',
        description: 'Thay nhớt, kiểm tra tổng quát',
        isActive: true,
        sortOrder: 1,
        templatesCount: 3,
      },
    ];
    let createdPayload: any = null;
    let updatedPayload: any = null;

    await page.route('**/api/service-categories**', async (route) => {
      const req = route.request();
      const method = req.method();

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: categories,
            pagination: {
              totalRecords: categories.length,
              totalPages: 1,
              currentPage: 1,
              limit: 10,
            },
          }),
        });
      }

      if (method === 'POST') {
        createdPayload = req.postDataJSON();
        const newCat = {
          id: 2,
          name: createdPayload.name,
          description: createdPayload.description,
          isActive: createdPayload.isActive ?? true,
          sortOrder: 2,
          templatesCount: 0,
        };
        categories = [...categories, newCat];
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Tạo nhóm dịch vụ thành công',
            data: newCat,
          }),
        });
      }

      if (method === 'PUT') {
        updatedPayload = req.postDataJSON();
        categories = categories.map((c) =>
          c.id === 2
            ? {
                ...c,
                name: updatedPayload.name,
                description: updatedPayload.description,
                isActive: updatedPayload.isActive,
              }
            : c
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Cập nhật nhóm dịch vụ thành công',
            data: categories.find((c) => c.id === 2),
          }),
        });
      }

      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/service-categories', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Bảo dưỡng định kỳ')).toBeVisible({ timeout: 20000 });

    // Tạo mới nhóm dịch vụ
    await page.click('button:has-text("Thêm nhóm dịch vụ")');
    await expect(page.locator('h2:has-text("Thêm nhóm dịch vụ")')).toBeVisible();
    await page.getByPlaceholder('Ví dụ: Vệ sinh xe, Bảo dưỡng...').fill('Vệ sinh khoang máy');
    await page.getByPlaceholder('Mô tả nhóm dịch vụ').fill('Làm sạch khoang động cơ an toàn');
    await page.click('button:has-text("Lưu lại")');

    await expect(page.locator('text=Vệ sinh khoang máy')).toBeVisible();
    expect(createdPayload).toMatchObject({
      name: 'Vệ sinh khoang máy',
      description: 'Làm sạch khoang động cơ an toàn',
      isActive: true,
    });

    // Chỉnh sửa nhóm dịch vụ vừa tạo (tắt isActive)
    const editButtons = page.locator('button[title="Chỉnh sửa"]');
    await editButtons.nth(1).click();
    await expect(page.locator('h2:has-text("Cập nhật nhóm dịch vụ")')).toBeVisible();

    await page.getByPlaceholder('Ví dụ: Vệ sinh xe, Bảo dưỡng...').fill('Vệ sinh khoang máy VIP');
    const checkbox = page.locator('label:has-text("Hoạt động") input[type="checkbox"]');
    await checkbox.uncheck();
    await page.click('button:has-text("Cập nhật")');

    await expect(page.locator('text=Vệ sinh khoang máy VIP')).toBeVisible();
    expect(updatedPayload).toMatchObject({
      name: 'Vệ sinh khoang máy VIP',
      isActive: false,
    });
  });

  test('E2E-ADM-CAT-03: Xóa nhóm dịch vụ qua ConfirmModal (soft-deactivate khi templatesCount > 0 và hard-delete khi === 0)', async ({
    page,
  }) => {
    let categories = [
      {
        id: 5,
        name: 'Nhóm có dịch vụ con',
        description: 'Đang chứa 4 dịch vụ',
        isActive: true,
        sortOrder: 1,
        templatesCount: 4,
      },
      {
        id: 6,
        name: 'Nhóm trống mới tạo',
        description: 'Chưa có dịch vụ',
        isActive: true,
        sortOrder: 2,
        templatesCount: 0,
      },
    ];

    await page.route('**/api/service-categories**', async (route) => {
      const req = route.request();
      const method = req.method();
      const url = req.url();

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: categories,
            pagination: {
              totalRecords: categories.length,
              totalPages: 1,
              currentPage: 1,
              limit: 10,
            },
          }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/5')) {
        categories = categories.map((c) => (c.id === 5 ? { ...c, isActive: false } : c));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'danh mục dịch vụ đã có dịch vụ phụ thuộc, đã được vô hiệu hóa thành công.',
            data: { deleted: false, isDeactivated: true },
          }),
        });
      }

      if (method === 'DELETE' && url.endsWith('/6')) {
        categories = categories.filter((c) => c.id !== 6);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Xóa danh mục dịch vụ thành công.',
            data: { deleted: true },
          }),
        });
      }

      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/service-categories', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Nhóm có dịch vụ con')).toBeVisible({ timeout: 20000 });

    // 1. Xóa nhóm có templatesCount > 0 -> hiển thị cảnh báo vô hiệu hóa
    const deleteButtons = page.locator('button[title="Xóa / Vô hiệu hóa"]');
    await deleteButtons.nth(0).click();
    await expect(
      page.locator('text=đang có 4 dịch vụ con phụ thuộc. Nếu xóa, nhóm này sẽ được chuyển sang vô hiệu hóa')
    ).toBeVisible();
    await page.click('button:has-text("Xác nhận xóa")');
    await expect(page.locator('text=Vô hiệu').first()).toBeVisible();

    // 2. Xóa nhóm có templatesCount === 0 -> xóa hẳn khỏi danh sách
    await deleteButtons.nth(1).click();
    await expect(
      page.locator('text=Bạn có chắc chắn muốn xóa nhóm dịch vụ "Nhóm trống mới tạo" không?')
    ).toBeVisible();
    await page.click('button:has-text("Xác nhận xóa")');
    await expect(page.locator('text=Nhóm trống mới tạo')).toHaveCount(0);
  });
});
