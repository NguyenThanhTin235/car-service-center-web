import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer Portal — UI, Responsive & Stacking-Context Regression Guards', () => {
  test('Stacking-Context Guard: Modals sit above PublicHeader without header overlap', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    // 1. Check CustomerBookingModal over PublicHeader
    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=appointments`);
    await page.getByRole('button', { name: 'Đặt lịch mới' }).click();
    await expect(page.getByText('Đặt lịch dịch vụ & sửa chữa')).toBeVisible({ timeout: 15000 });

    const bookingModalTopIsNotHeader = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, 24);
      return Boolean(el && !el.closest('header'));
    });
    expect(bookingModalTopIsNotHeader).toBe(true);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();

    // 2. Check CustomerQuotationModal over PublicHeader
    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=tracking`);
    await page.getByRole('button', { name: /Xem chi tiết & Phê duyệt/i }).click({ timeout: 15000 });
    await expect(page.getByText('Bảng Báo Giá Chi Tiết Dịch Vụ')).toBeVisible({ timeout: 15000 });

    const quotationModalTopIsNotHeader = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, 24);
      return Boolean(el && !el.closest('header'));
    });
    expect(quotationModalTopIsNotHeader).toBe(true);

    expect(pageErrors).toEqual([]);
  });

  test('Multi-Viewport Zero Horizontal Overflow across Desktop (1440), Tablet (768), and Mobile (390)', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    const viewports = [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);

      for (const routePath of ['/home', '/customer/profile?tab=overview']) {
        await page.goto(`${CUSTOMER_BASE_URL}${routePath}`);
        await page.waitForLoadState('domcontentloaded');
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });
        expect(hasOverflow, `Overflow detected on ${routePath} at ${vp.width}x${vp.height}`).toBe(
          false
        );
      }
    }

    expect(pageErrors).toEqual([]);
  });

  test('Mobile Drawer, 2-Col Footer, Horizontal Scrollbars, and Tracking/History UI fixes hold', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    // 1. /home checks: category horizontal scrollbar & 2-col mobile footer
    await page.goto(`${CUSTOMER_BASE_URL}/home`);
    const homeTablist = page.locator('#services [role="tablist"]');
    await expect(homeTablist).toHaveClass(/styled-scrollbar-x/);

    const footerColsAligned = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('footer h3'));
      const explore = h3s.find((el) => el.textContent?.includes('Khám phá'));
      const portal = h3s.find((el) => el.textContent?.includes('Cổng khách hàng'));
      if (!explore || !portal) return false;
      const y1 = explore.getBoundingClientRect().top;
      const y2 = portal.getBoundingClientRect().top;
      return Math.abs(y1 - y2) < 12;
    });
    expect(footerColsAligned).toBe(true);

    // 2. Mobile drawer check: NO duplicate customer portal links inside mobile menu dialog
    await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu điều hướng' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Vào cổng khách hàng')).toHaveCount(0);
    await page.getByRole('button', { name: 'Đóng menu' }).click();

    // 3. Profile mobile tab bar scrollbar
    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=tracking`);
    const profileScrollbar = page.locator('.styled-scrollbar-x').first();
    await expect(profileScrollbar).toBeVisible({ timeout: 15000 });

    // 4. TrackingView active step must NOT duplicate 'Đang thực hiện' with 'Đang kiểm định'
    await expect(page.getByText('Đang kiểm định').first()).toBeVisible({ timeout: 15000 });
    const step3Box = page
      .locator('h4', { hasText: 'Bước 3: Kiểm định chất lượng (KCS)' })
      .locator('..');
    await expect(step3Box.getByText('Đang thực hiện', { exact: true })).toHaveCount(0);

    // 5. HistoryView shortened heading check
    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=history`);
    await expect(page.getByRole('heading', { name: 'Lịch sử bảo dưỡng' })).toBeVisible({
      timeout: 15000,
    });

    expect(pageErrors).toEqual([]);
  });

  test('Accessibility: prefers-reduced-motion keeps modals and pages fully visible without stuck opacity', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=appointments`);
    await page.getByRole('button', { name: 'Đặt lịch mới' }).click();

    const modalTitle = page.getByText('Đặt lịch dịch vụ & sửa chữa');
    await expect(modalTitle).toBeVisible({ timeout: 15000 });

    const modalPanelOpacity = await page.evaluate(() => {
      const panel = document.querySelector('.cw-modal-panel');
      return panel ? getComputedStyle(panel).opacity : null;
    });
    expect(modalPanelOpacity).toBe('1');

    expect(pageErrors).toEqual([]);
  });
});
