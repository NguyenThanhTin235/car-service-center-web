import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer AI Support Chatbot — Mobile 390px, 4-State UI, Fallback & XSS E2E', () => {
  test('Mobile 390x844: FAB >= 52x52px, Bottom Sheet has zero horizontal overflow, >= 44px touch targets, unified chips & no duplicate labels', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await setupCustomerApiMocks(page);

    // Override welcome with an intentional duplicate label between actions and suggested_questions
    // to verify ChatMessageBubble deduplicates them and applies unified chip styling.
    await page.route('**/api/v1/ai-chat/welcome**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            auth_mode: 'GUEST',
            greeting:
              'Chào Anh/Chị! Em là **Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro** (**0% VAT**).',
            suggested_questions: [
              '  đặt lịch dịch vụ ngay  ',
              'Xe phanh kêu két két là bị sao?',
              'Bảng giá bảo dưỡng định kỳ 40.000 km',
            ],
            actions: [
              {
                type: 'OPEN_BOOKING_MODAL',
                label: 'Đặt lịch dịch vụ ngay',
                icon: 'calendar_month',
                target: 'modal:booking',
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    // 1. Verify FAB size >= 52x52px and within 390x844 viewport
    const fab = page.getByTestId('ai-chat-fab');
    await expect(fab).toBeVisible();
    const fabBox = await fab.boundingBox();
    expect(fabBox).not.toBeNull();
    expect(fabBox!.width).toBeGreaterThanOrEqual(52);
    expect(fabBox!.height).toBeGreaterThanOrEqual(52);
    expect(fabBox!.x).toBeGreaterThanOrEqual(0);
    expect(fabBox!.y).toBeGreaterThanOrEqual(0);
    expect(fabBox!.x + fabBox!.width).toBeLessThanOrEqual(390);
    expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(844);

    // Zero horizontal overflow before opening panel
    const overflowBefore = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflowBefore.scrollWidth).toBeLessThanOrEqual(overflowBefore.innerWidth);

    // 2. Open Bottom Sheet
    await fab.click();
    const panel = page.getByTestId('ai-chat-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro/i)).toBeVisible();

    // Verify Bottom Sheet layout fills mobile width cleanly without horizontal overflow
    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.x).toBe(0);
    expect(panelBox!.width).toBeLessThanOrEqual(390);
    expect(panelBox!.width).toBeGreaterThanOrEqual(388);
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(844.5);

    const overflowAfter = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflowAfter.scrollWidth).toBeLessThanOrEqual(overflowAfter.innerWidth);

    // 3. Verify Close button, Input & Send button touch targets >= 44px
    const closeBtn = page.getByTestId('ai-chat-close');
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);

    const inputBox = await page.getByTestId('ai-chat-input').boundingBox();
    expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const sendBox = await page.getByTestId('ai-chat-send').boundingBox();
    expect(sendBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(sendBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // 4. Verify deduplication of duplicate action/suggestedQuestion labels
    await expect(panel.getByRole('button', { name: /Đặt lịch dịch vụ ngay/i })).toHaveCount(1);

    // 5. Verify all Action & Quick Reply chips have height >= 44px and share unified thin-border chip style
    const actionChip = panel.getByTestId('ai-chat-action-OPEN_BOOKING_MODAL');
    const quickChip1 = panel.getByRole('button', { name: 'Xe phanh kêu két két là bị sao?' });
    const quickChip2 = panel.getByRole('button', { name: 'Bảng giá bảo dưỡng định kỳ 40.000 km' });

    for (const chip of [actionChip, quickChip1, quickChip2]) {
      await expect(chip).toBeVisible();
      const chipBox = await chip.boundingBox();
      expect(chipBox).not.toBeNull();
      expect(chipBox!.height).toBeGreaterThanOrEqual(44);
      expect(chipBox!.x + chipBox!.width).toBeLessThanOrEqual(390);
    }

    const actionStyle = await actionChip.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        borderTopWidth: s.borderTopWidth,
        borderTopStyle: s.borderTopStyle,
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        color: s.color,
      };
    });
    const quickStyle = await quickChip1.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        borderTopWidth: s.borderTopWidth,
        borderTopStyle: s.borderTopStyle,
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        color: s.color,
      };
    });
    expect(actionStyle).toEqual(quickStyle);
    expect(actionStyle.borderTopWidth).toBe('1px');
    expect(actionStyle.borderTopStyle).toBe('solid');

    // Close Bottom Sheet cleanly and verify FAB returns
    await closeBtn.click();
    await expect(panel).toHaveCount(0);
    await expect(fab).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('Mobile 390x844: Modal z-50 covers z-40 chat FAB without overlapping CTA footer', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=overview`);

    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');
    await expect(panel).toBeVisible();

    // Trigger VIEW_QUOTATION -> Auto-minimizes chat panel and opens z-50 CustomerQuotationModal
    await panel.getByTestId('ai-chat-action-VIEW_QUOTATION').click();
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0);

    const modalPanel = page.locator('.cw-modal-panel');
    await expect(modalPanel).toBeVisible({ timeout: 15000 });

    // Verify z-50 modal overlay sits above z-40 ai-chat-fab at the FAB's screen coordinates
    const fab = page.getByTestId('ai-chat-fab');
    await expect(fab).toBeAttached();
    const fabBox = await fab.boundingBox();
    expect(fabBox).not.toBeNull();

    const hitTestIsInsideFab = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return Boolean(el?.closest('[data-testid="ai-chat-fab"]'));
      },
      { x: fabBox!.x + fabBox!.width / 2, y: fabBox!.y + fabBox!.height / 2 }
    );
    expect(hitTestIsInsideFab).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('4-State UI: HTTP 500 triggers friendly Vietnamese error + >=44px retry button, and retry recovers without duplicating user message', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    let messageCalls = 0;
    const promptText = 'Bảo dưỡng 40.000 km giá bao nhiêu?';

    await page.route('**/api/v1/ai-chat/message', async (route) => {
      messageCalls += 1;
      if (messageCalls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            code: 500,
            message: 'Hệ thống trợ lý AI đang bận, vui lòng thử lại hoặc gọi Hotline 1900 6868.',
            error: { code: 'AI_CHAT_ERROR' },
            timestamp: new Date().toISOString(),
          }),
        });
      }

      // Brief delay to allow observing Loading state on retry
      await new Promise((resolve) => setTimeout(resolve, 120));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            auth_mode: 'GUEST',
            is_fallback: false,
            reply:
              'Gói bảo dưỡng 40.000 km có giá tham khảo từ **2.500.000 ₫** (**0% VAT**).',
            intent: 'CATALOG_PRICING',
            suggested_questions: ['Đặt lịch bảo dưỡng ngay'],
            actions: [],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);
    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');
    await expect(panel).toBeVisible();

    await page.getByTestId('ai-chat-input').fill(promptText);
    await page.getByTestId('ai-chat-send').click();

    // Error state appears with friendly Vietnamese message and >= 44px Retry button
    const errorBanner = panel.getByTestId('ai-chat-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Hệ thống trợ lý AI đang bận|1900 6868/i);

    const retryBtn = errorBanner.getByRole('button', { name: 'Thử gửi lại' });
    await expect(retryBtn).toBeVisible();
    const retryBox = await retryBtn.boundingBox();
    expect(retryBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // User message appears once before retry
    await expect(panel.getByText(promptText, { exact: true })).toHaveCount(1);

    // Click Retry -> Loading indicator -> Recovers cleanly without duplicating user bubble
    await retryBtn.click();
    await expect(
      panel.getByText(/Gói bảo dưỡng 40.000 km có giá tham khảo từ/i)
    ).toBeVisible({ timeout: 10000 });
    await expect(errorBanner).toHaveCount(0);
    await expect(panel.getByText(promptText, { exact: true })).toHaveCount(1);
    expect(messageCalls).toBe(2);
    expect(pageErrors).toEqual([]);
  });

  test('4-State UI: HTTP 429 rate-limit renders empathetic Vietnamese cooldown copy and recovers on retry', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    let messageCalls = 0;
    const promptText = 'Kiểm tra lịch hẹn giúp tôi';

    await page.route('**/api/v1/ai-chat/message', async (route) => {
      messageCalls += 1;
      if (messageCalls === 1) {
        // Omit message to also verify frontend's built-in 429 Vietnamese fallback copy
        return route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            code: 429,
            error: {
              code: 'AI_RATE_LIMIT_EXCEEDED',
              details: { retryAfterSeconds: 45 },
            },
            timestamp: new Date().toISOString(),
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            auth_mode: 'GUEST',
            is_fallback: false,
            reply: 'Xưởng mở cửa từ **Thứ 2 – Thứ 7** (07:30 – 17:30) ạ.',
            intent: 'BOOKING_REQUEST',
            suggested_questions: [],
            actions: [],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);
    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');

    await page.getByTestId('ai-chat-input').fill(promptText);
    await page.getByTestId('ai-chat-send').click();

    const errorBanner = panel.getByTestId('ai-chat-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/thao tác hơi nhanh|vui lòng đợi/i);

    const retryBtn = errorBanner.getByRole('button', { name: 'Thử gửi lại' });
    const retryBox = await retryBtn.boundingBox();
    expect(retryBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await retryBtn.click();
    await expect(panel.getByText(/Xưởng mở cửa từ/i)).toBeVisible();
    await expect(errorBanner).toHaveCount(0);
    await expect(panel.getByText(promptText, { exact: true })).toHaveCount(1);
    expect(messageCalls).toBe(2);
    expect(pageErrors).toEqual([]);
  });

  test('Fallback Indicator: displays "Phản hồi nhanh từ dữ liệu trực tiếp của xưởng" badge when is_fallback is true', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
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
            auth_mode: 'GUEST',
            is_fallback: true,
            reply:
              'Hiện tại dịch vụ **Thay dầu động cơ tổng hợp 5W-30** có giá **950.000 ₫** (**0% VAT**).',
            intent: 'CATALOG_PRICING',
            suggested_questions: ['Đặt lịch thay dầu ngay'],
            actions: [],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);
    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');

    await page.getByTestId('ai-chat-input').fill('thay dau bao nhieu tien');
    await page.getByTestId('ai-chat-send').click();

    await expect(
      panel.getByText('Phản hồi nhanh từ dữ liệu trực tiếp của xưởng')
    ).toBeVisible();
    await expect(panel.locator('strong', { hasText: '950.000 ₫' })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('XSS Safety: Markdown parser escapes <script> and <img onerror> payloads while safely bolding currency', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await setupCustomerApiMocks(page);

    const xssPayload =
      '<script>window.__xss=1</script><img src=x onerror="window.__xss=2"> **2.500.000 ₫**';

    await page.route('**/api/v1/ai-chat/message', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          message: 'OK',
          data: {
            auth_mode: 'GUEST',
            is_fallback: false,
            reply: xssPayload,
            intent: 'CATALOG_PRICING',
            suggested_questions: [],
            actions: [],
          },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${CUSTOMER_BASE_URL}/home`);
    await page.getByTestId('ai-chat-fab').click();
    const panel = page.getByTestId('ai-chat-panel');

    await page.getByTestId('ai-chat-input').fill('Test XSS safety');
    await page.getByTestId('ai-chat-send').click();

    const boldAmount = panel.locator('strong', { hasText: '2.500.000 ₫' });
    await expect(boldAmount).toBeVisible();
    await expect(boldAmount).toHaveClass(/font-bold/);
    await expect(boldAmount).toHaveClass(/font-mono/);

    // Verify no script/img tags were injected into the chat panel DOM and window.__xss stayed undefined
    await expect(panel.locator('script, img')).toHaveCount(0);
    await expect(panel).toContainText('<script>window.__xss=1</script>');
    const xssResult = await page.evaluate(() => (window as unknown as { __xss?: unknown }).__xss);
    expect(xssResult).toBeUndefined();
    expect(pageErrors).toEqual([]);
  });
});
