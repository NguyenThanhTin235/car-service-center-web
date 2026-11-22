import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  attachPageErrorGuard,
  setupCustomerApiMocks,
  MOCK_PUBLIC_SERVICES,
} from './helpers/customer-mocks';

test.describe('Customer Portal — Public Home (/home)', () => {
  test('renders hero, cycles garage photos carousel, and switches process steps', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    await expect(
      page.getByRole('heading', { level: 1, name: /Chăm sóc xe minh bạch/i })
    ).toBeVisible();

    // 3 hero capability pillars
    await expect(page.getByText('Báo giá minh bạch').first()).toBeVisible();
    await expect(page.getByText('Kiểm định KCS').first()).toBeVisible();
    await expect(page.getByText('Thanh toán SePay').first()).toBeVisible();

    // Switch hero garage photo carousel tab
    const photoTablist = page.getByRole('tablist', { name: 'Chọn ảnh xưởng dịch vụ' });
    const photoTabs = photoTablist.getByRole('tab');
    await expect(photoTabs).toHaveCount(5);
    await photoTabs.nth(1).click();
    await expect(photoTabs.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Interactive 8-step process stepper
    const processSection = page.locator('#process');
    await processSection.getByRole('button', { name: '04', exact: true }).click();
    await expect(processSection.getByText('04 / 08')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('displays 4-state Service Catalog: pricing formats, category filter, search, pagination, and empty reset', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    const servicesSection = page.locator('#services');

    // Initially caps at 6 cards with "Xem tất cả 7 dịch vụ"
    await expect(servicesSection.getByText('6/7 hạng mục')).toBeVisible();
    await expect(servicesSection.getByText('Từ 2.500.000 ₫')).toBeVisible();
    await expect(servicesSection.getByText('Khảo sát & báo giá')).toBeVisible();

    // Expand all 7 services
    await servicesSection.getByRole('button', { name: /Xem tất cả 7 dịch vụ/i }).click();
    await expect(servicesSection.getByText('7/7 hạng mục')).toBeVisible();
    await expect(servicesSection.getByText('Đánh bóng & phủ Ceramic thân vỏ')).toBeVisible();

    // Collapse back to 6
    await servicesSection.getByRole('button', { name: /Thu gọn danh sách/i }).click();
    await expect(servicesSection.getByText('6/7 hạng mục')).toBeVisible();

    // Filter by category pill
    await servicesSection.getByRole('tab', { name: /Sửa chữa động cơ/i }).click();
    await expect(servicesSection.getByText('Chẩn đoán động cơ OBD-II')).toBeVisible();
    await expect(servicesSection.getByText('Vệ sinh nội thất & khử khuẩn cabin')).toHaveCount(0);

    // Switch back to Tất cả
    await servicesSection.getByRole('tab', { name: /Tất cả/i }).click();

    // Deferred live search filtering + clear button
    const searchInput = servicesSection.getByRole('searchbox', { name: 'Tìm nhanh dịch vụ' });
    await searchInput.fill('OBD-II');
    await expect(servicesSection.getByText('1/1 hạng mục')).toBeVisible();
    await expect(servicesSection.getByText('Chẩn đoán động cơ OBD-II')).toBeVisible();

    // Empty search state & reset button
    await searchInput.fill('khong-ton-tai-xyz');
    await expect(servicesSection.getByText('Không tìm thấy dịch vụ phù hợp')).toBeVisible();
    await servicesSection.getByRole('button', { name: 'Xem tất cả dịch vụ' }).click();
    await expect(servicesSection.getByText('6/7 hạng mục')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('handles Service Catalog API error and recovers on retry', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    let serviceAttempt = 0;
    await page.route('**/api/public/services**', async (route) => {
      serviceAttempt += 1;
      if (serviceAttempt === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Internal error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_PUBLIC_SERVICES }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    await expect(
      page.getByRole('heading', { name: 'Không thể tải danh mục dịch vụ' })
    ).toBeVisible();
    await page.getByRole('button', { name: /Thử lại/i }).click();
    await expect(page.getByText('Bảo dưỡng 40.000 km')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('supports GPS directions toggle on embedded Google Maps', async ({ context, page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await context.grantPermissions(['geolocation'], { origin: CUSTOMER_BASE_URL });
    await context.setGeolocation({ latitude: 10.8411, longitude: 106.8098 });
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    const mapIframe = page.locator('iframe[title*="Bản đồ Google Maps"]');
    await expect(mapIframe).toBeVisible();

    await page.getByRole('button', { name: 'Chỉ đường trên Google Maps' }).click();
    await expect(page.getByRole('button', { name: 'Xem lại vị trí xưởng' })).toBeVisible();
    await expect(mapIframe).toHaveAttribute('src', /saddr=10\.841100/);

    await page.getByRole('button', { name: 'Xem lại vị trí xưởng' }).click();
    await expect(page.getByRole('button', { name: 'Chỉ đường trên Google Maps' })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
