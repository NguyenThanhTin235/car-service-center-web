import { test, expect } from '@playwright/test';

test.describe('Admin Services E2E (/services) (TICKET-ADM-05)', () => {
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

    await page.route('**/api/services/categories**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            { id: 1, name: 'Bảo dưỡng định kỳ', is_active: true, sort_order: 1 },
            { id: 2, name: 'Chăm sóc xe', is_active: true, sort_order: 2 },
          ],
        }),
      });
    });
  });

  test('E2E-ADM-SRV-01: Lọc danh sách theo search, dropdown filterCat và phân trang', async ({
    page,
  }) => {
    const queryLog: string[] = [];

    await page.route('**/api/services**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/categories')) return route.fallback();

      queryLog.push(url.search);
      const search = url.searchParams.get('search') || '';
      const categoryId = url.searchParams.get('categoryId') || '';
      const pageNum = Number(url.searchParams.get('page') || '1');

      if (categoryId === '2' || search.includes('Ceramic')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: [
              {
                id: 22,
                name: 'Phủ Ceramic 9H',
                description: 'Bảo vệ sơn xe',
                pricingType: 'VEHICLE_SIZE',
                fixedPrice: null,
                isActive: true,
                category: { id: 2, name: 'Chăm sóc xe' },
                sizePrices: [{ vehicleSize: 'SMALL', price: 4500000 }],
                createdAt: new Date().toISOString(),
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
                id: 12,
                name: 'Vệ sinh kim phun',
                description: '',
                pricingType: 'FIXED',
                fixedPrice: 350000,
                isActive: true,
                category: { id: 1, name: 'Bảo dưỡng định kỳ' },
                sizePrices: [],
                createdAt: new Date().toISOString(),
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
              name: 'Thay dầu nhớt tổng hợp',
              description: '5W-30',
              pricingType: 'FIXED',
              fixedPrice: 650000,
              isActive: true,
              category: { id: 1, name: 'Bảo dưỡng định kỳ' },
              sizePrices: [],
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { totalRecords: 11, totalPages: 2, currentPage: 1, limit: 10 },
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/services', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Thay dầu nhớt tổng hợp')).toBeVisible({ timeout: 20000 });

    // Phân trang sang trang 2
    const page2Btn = page.locator('button[aria-label="Trang sau"], button:has-text("2")').first();
    await page2Btn.click();
    await expect(page.locator('text=Vệ sinh kim phun')).toBeVisible();

    // Lọc theo category dropdown (filterCat)
    const filterCatSelect = page.locator('select').filter({ hasText: 'Tất cả danh mục' });
    await filterCatSelect.selectOption('2');
    await expect(page.locator('text=Phủ Ceramic 9H')).toBeVisible();

    // Search theo tên
    const searchInput = page.getByPlaceholder('Tìm theo tên dịch vụ...');
    await searchInput.fill('Ceramic');
    await searchInput.press('Enter');
    await expect(page.locator('text=Phủ Ceramic 9H')).toBeVisible();

    expect(queryLog.some((q) => q.includes('categoryId=2'))).toBe(true);
    expect(queryLog.some((q) => q.includes('search=Ceramic'))).toBe(true);
  });

  test('E2E-ADM-SRV-02: Tạo & Sửa dịch vụ với cả 3 chế độ giá (FIXED, VEHICLE_SIZE, LABOUR_PARTS)', async ({
    page,
  }) => {
    let services = [
      {
        id: 1,
        name: 'Kiểm tra tổng quát',
        description: '30 hạng mục',
        pricingType: 'FIXED',
        fixedPrice: 200000,
        isActive: true,
        category: { id: 1, name: 'Bảo dưỡng định kỳ' },
        sizePrices: [],
        createdAt: new Date().toISOString(),
      },
    ];
    const submittedPayloads: any[] = [];

    await page.route('**/api/services**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.pathname.endsWith('/categories')) return route.fallback();

      const method = req.method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: services,
            pagination: {
              totalRecords: services.length,
              totalPages: 1,
              currentPage: 1,
              limit: 10,
            },
          }),
        });
      }

      if (method === 'POST') {
        const body = req.postDataJSON();
        submittedPayloads.push(body);
        const created = {
          id: services.length + 10,
          name: body.name,
          description: body.description || '',
          pricingType: body.pricingType,
          fixedPrice: body.fixedPrice ?? null,
          isActive: true,
          category: { id: body.categoryId, name: body.categoryId === 2 ? 'Chăm sóc xe' : 'Bảo dưỡng định kỳ' },
          sizePrices: body.sizePrices || [],
          createdAt: new Date().toISOString(),
        };
        services = [...services, created];
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Tạo danh mục dịch vụ thành công',
            data: created,
          }),
        });
      }

      if (method === 'PUT') {
        const body = req.postDataJSON();
        submittedPayloads.push({ updated: true, ...body });
        services = services.map((s) =>
          s.id === 1
            ? {
                ...s,
                name: body.name,
                pricingType: body.pricingType,
                fixedPrice: body.fixedPrice ?? null,
                sizePrices: body.sizePrices || [],
              }
            : s
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Cập nhật danh mục dịch vụ thành công',
            data: services[0],
          }),
        });
      }

      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/services', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Kiểm tra tổng quát')).toBeVisible({ timeout: 20000 });

    // 1. Tạo mới dịch vụ VEHICLE_SIZE với đủ 5 kích thước xe
    await page.click('button:has-text("Thêm dịch vụ mới")');
    await page.getByPlaceholder('Tên dịch vụ', { exact: true }).fill('Rửa xe chi tiết 3 bước');
    await page.locator('select').filter({ hasText: 'Chọn danh mục' }).selectOption('2');
    await page.locator('select').filter({ hasText: 'Giá cố định' }).selectOption('VEHICLE_SIZE');

    await page.locator('label:has-text("Xe nhỏ (S)") input').fill('80000');
    await page.locator('label:has-text("Xe vừa (M)") input').fill('100000');
    await page.locator('label:has-text("Xe lớn (L)") input').fill('120000');
    await page.locator('label:has-text("Xe rất lớn / SUV (XL)") input').fill('150000');
    await page.locator('label:has-text("Xe tải (Truck)") input').fill('200000');

    await page.click('button:has-text("Lưu lại")');
    await expect(page.locator('text=Rửa xe chi tiết 3 bước')).toBeVisible();
    await expect(page.locator('text=5 mức giá')).toBeVisible();

    // 2. Tạo mới dịch vụ LABOUR_PARTS
    await page.click('button:has-text("Thêm dịch vụ mới")');
    await page.getByPlaceholder('Tên dịch vụ', { exact: true }).fill('Đại tu hộp số tự động');
    await page.locator('select').filter({ hasText: 'Chọn danh mục' }).selectOption('1');
    await page.locator('select').filter({ hasText: 'Giá cố định' }).selectOption('LABOUR_PARTS');
    await page.click('button:has-text("Lưu lại")');
    await expect(page.locator('text=Đại tu hộp số tự động')).toBeVisible();
    await expect(page.locator('text=Tính sau')).toBeVisible();

    // 3. Chỉnh sửa dịch vụ FIXED
    await page.locator('button[title="Chỉnh sửa"]').first().click();
    await page.getByPlaceholder('Tên dịch vụ', { exact: true }).fill('Kiểm tra tổng quát Pro');
    await page.getByPlaceholder('VD: 500000').fill('300000');
    await page.click('button:has-text("Cập nhật")');
    await expect(page.locator('text=Kiểm tra tổng quát Pro')).toBeVisible();

    expect(submittedPayloads[0]).toMatchObject({
      name: 'Rửa xe chi tiết 3 bước',
      pricingType: 'VEHICLE_SIZE',
      sizePrices: [
        { vehicleSize: 'SMALL', price: 80000 },
        { vehicleSize: 'MEDIUM', price: 100000 },
        { vehicleSize: 'LARGE', price: 120000 },
        { vehicleSize: 'SUV', price: 150000 },
        { vehicleSize: 'TRUCK', price: 200000 },
      ],
    });
    expect(submittedPayloads[1]).toMatchObject({
      name: 'Đại tu hộp số tự động',
      pricingType: 'LABOUR_PARTS',
    });
    expect(submittedPayloads[2]).toMatchObject({
      updated: true,
      name: 'Kiểm tra tổng quát Pro',
      pricingType: 'FIXED',
      fixedPrice: 300000,
    });
  });

  test('E2E-ADM-SRV-03 & 04: Toggle kích hoạt và Xóa dịch vụ (soft-deactivation vs hard-delete)', async ({
    page,
  }) => {
    let services = [
      {
        id: 5,
        name: 'Bảo dưỡng phanh có lịch sử',
        description: '',
        pricingType: 'FIXED',
        fixedPrice: 400000,
        isActive: true,
        category: { id: 1, name: 'Bảo dưỡng định kỳ' },
        sizePrices: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 88,
        name: 'Dịch vụ tạo nhầm',
        description: '',
        pricingType: 'FIXED',
        fixedPrice: 100000,
        isActive: true,
        category: { id: 1, name: 'Bảo dưỡng định kỳ' },
        sizePrices: [],
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/services**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.pathname.endsWith('/categories')) return route.fallback();

      const method = req.method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: services,
            pagination: {
              totalRecords: services.length,
              totalPages: 1,
              currentPage: 1,
              limit: 10,
            },
          }),
        });
      }

      if (method === 'PATCH' && url.pathname.endsWith('/5/toggle')) {
        services = services.map((s) => (s.id === 5 ? { ...s, isActive: !s.isActive } : s));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'Vô hiệu hóa thành công',
            data: { isActive: false },
          }),
        });
      }

      if (method === 'DELETE' && url.pathname.endsWith('/5')) {
        services = services.map((s) => (s.id === 5 ? { ...s, isActive: false } : s));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'success',
            deleted: false,
            isDeactivated: true,
            message:
              'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.',
          }),
        });
      }

      if (method === 'DELETE' && url.pathname.endsWith('/88')) {
        services = services.filter((s) => s.id !== 88);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'success',
            deleted: true,
            isDeactivated: false,
            message: 'Đã xóa dịch vụ thành công',
            data: { id: 88 },
          }),
        });
      }

      return route.continue();
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3001/services', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Bảo dưỡng phanh có lịch sử')).toBeVisible({ timeout: 20000 });

    // E2E-ADM-SRV-03: Toggle kích hoạt dịch vụ qua ConfirmModal
    await page.locator('button[title="Vô hiệu hóa"]').first().click();
    await expect(page.locator('h2:has-text("Vô hiệu hóa dịch vụ")')).toBeVisible();
    await page.click('button:has-text("Vô hiệu hóa")');
    await expect(page.locator('text=Ngừng cung cấp').first()).toBeVisible();

    // E2E-ADM-SRV-04 (1): Xóa dịch vụ có lịch sử -> soft-deactivation
    await page.locator('button[title="Xóa dịch vụ"]').first().click();
    await expect(page.locator('h2:has-text("Xóa dịch vụ")')).toBeVisible();
    await page.click('button:has-text("Xác nhận xóa")');
    await expect(
      page.locator('text=Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa').first()
    ).toBeVisible();

    // E2E-ADM-SRV-04 (2): Xóa dịch vụ chưa có giao dịch -> hard-delete
    await page.locator('button[title="Xóa dịch vụ"]').nth(1).click();
    await page.click('button:has-text("Xác nhận xóa")');
    await expect(page.locator('text=Dịch vụ tạo nhầm')).toHaveCount(0);
  });
});
