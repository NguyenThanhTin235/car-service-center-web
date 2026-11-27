import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  MOCK_CUSTOMER_USER,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer AI Support Chatbot — Dual-Mode Concierge E2E', () => {
  test('Guest consults on /home, sees >=44px chips, saves booking intent, and promotes session upon Login', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/auth/login', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'Đăng nhập thành công',
          data: {
            user: MOCK_CUSTOMER_USER,
            token: 'mock-customer-jwt-token-12345',
            refreshToken: 'mock-customer-refresh-token',
          },
          timestamp: Date.now(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    // FAB is visible at z-40
    const fab = page.getByTestId('ai-chat-fab');
    await expect(fab).toBeVisible();
    await fab.click();

    const panel = page.getByTestId('ai-chat-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro/i)).toBeVisible();

    // Check touch target height >= 44px on quick reply chip
    const firstChip = panel.getByRole('button', { name: 'Xe phanh kêu két két là bị sao?' });
    await expect(firstChip).toBeVisible();
    const box = await firstChip.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Send a message as Guest and wait for the specific assistant response action chip
    const input = page.getByTestId('ai-chat-input');
    await input.fill('Xe phanh kêu két két khi rà thắng');
    await page.getByTestId('ai-chat-send').click();

    const bookActionBtn = panel.getByRole('button', { name: 'Đặt lịch kiểm tra phanh' });
    await expect(bookActionBtn).toBeVisible({ timeout: 10000 });

    // Clicking OPEN_BOOKING_MODAL as Guest saves intent & navigates to /login
    await bookActionBtn.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    // Login -> auto-redirects to /customer/profile?tab=appointments&openBooking=1 with pre-filled BookingModal
    await page.fill('input[name="email"]', MOCK_CUSTOMER_USER.email);
    await page.fill('input[name="password"]', 'Secret123@');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/customer\/profile/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Đặt lịch dịch vụ & sửa chữa' })).toBeVisible({
      timeout: 15000,
    });

    // Chat widget auto-minimized so it doesn't cover the z-50 BookingModal
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0);

    // Verify pre-filled notes in Step 2 of CustomerBookingModal
    await page.locator('.cw-modal-panel').getByText('Dịch vụ & Mô tả').click();
    await expect(
      page.locator('.cw-modal-panel').getByPlaceholder('Nhập mô tả tình trạng xe của bạn (nếu có)...')
    ).toHaveValue('Xe phanh kêu két két khi rà thắng');

    // Close BookingModal and verify Guest-to-Auth Session Promotion preserved previous conversation
    await page.locator('.cw-modal-panel button:has(span:text("close"))').click();
    await page.getByTestId('ai-chat-fab').click();

    const promotedPanel = page.getByTestId('ai-chat-panel');
    await expect(promotedPanel.getByText('Xe phanh kêu két két khi rà thắng').first()).toBeVisible();
    await expect(promotedPanel.getByText(new RegExp(MOCK_CUSTOMER_USER.fullName))).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('Authenticated customer triggers VIEW_QUOTATION & VIEW_INVOICE with Auto-Minimize, and Logout clears sessionStorage', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.route('**/api/v1/ai-chat/message', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            auth_mode: 'CUSTOMER',
            is_fallback: false,
            reply: 'Hóa đơn **#INV-261120-001** còn cần thanh toán **2.500.000 ₫** (**0% VAT**).',
            intent: 'INVOICE_PAYMENT',
            suggested_questions: [],
            actions: [
              {
                type: 'VIEW_INVOICE',
                label: 'Thanh toán qua QR SePay',
                icon: 'qr_code_2',
                target: 'modal:invoice',
                payload: { invoiceId: 901 },
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=overview`);

    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');
    await expect(panel.getByTestId('ai-chat-action-VIEW_QUOTATION')).toBeVisible();

    // Trigger VIEW_QUOTATION -> Auto-Minimizes and opens CustomerQuotationModal on Tracking tab
    await panel.getByTestId('ai-chat-action-VIEW_QUOTATION').click();
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0);
    await expect(page).toHaveURL(/tab=tracking/);
    await expect(page.locator('.cw-modal-panel')).toBeVisible({ timeout: 15000 });

    // Close CustomerQuotationModal cleanly before re-opening chat
    await page.locator('.cw-modal-panel button:has(span:text("close"))').first().click();
    await expect(page.locator('.cw-modal-panel')).toHaveCount(0);

    await page.getByTestId('ai-chat-fab').click();
    await page.getByTestId('ai-chat-input').fill('thanh toan hoa don');
    await page.getByTestId('ai-chat-send').click();

    await page.getByTestId('ai-chat-action-VIEW_INVOICE').click();
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0);
    await expect(page).toHaveURL(/tab=invoices/);
    await expect(page.getByText('Thanh toán trực tuyến SePay')).toBeVisible({ timeout: 15000 });

    // Close SePay payment modal cleanly before interacting with header menu
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.getByText('Thanh toán trực tuyến SePay')).toHaveCount(0);

    // Verify user chat key exists in sessionStorage before logout, and is wiped on Logout
    const hasKeyBeforeLogout = await page.evaluate(() =>
      Object.keys(window.sessionStorage).some((k) => k.startsWith('csc_ai_chat_history:user_'))
    );
    expect(hasKeyBeforeLogout).toBe(true);

    // Trigger logout via header profile dropdown
    await page.getByRole('button', { name: new RegExp(MOCK_CUSTOMER_USER.fullName, 'i') }).click();
    await page.locator('#btn-logout').click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    const hasKeyAfterLogout = await page.evaluate(() =>
      Object.keys(window.sessionStorage).some((k) => k.startsWith('csc_ai_chat_history:user_'))
    );
    expect(hasKeyAfterLogout).toBe(false);

    expect(pageErrors).toEqual([]);
  });
});
