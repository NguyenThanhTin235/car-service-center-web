import { test, expect } from '@playwright/test';
import {
  CUSTOMER_BASE_URL,
  attachPageErrorGuard,
  injectCustomerSession,
  setupCustomerApiMocks,
} from './helpers/customer-mocks';

test.describe('Customer Portal — Tracking, Quotations, SePay Invoices, History & Notifications', () => {
  test('UC-15 TrackingView: loads CheckIn, QC, and Quotation Approve flow', async ({ page }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=tracking`);

    await expect(page.getByText('WO-202611-001').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('60%').first()).toBeVisible();

    // Open lazy CustomerCheckInModal
    await page.getByRole('button', { name: /Xem biên bản tiếp nhận/i }).first().click();
    await expect(page.getByText(/42[.,]500/).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Đóng' }).first().click();

    // Open lazy CustomerQCModal
    await page.getByRole('button', { name: /Xem chứng nhận KCS/i }).click();
    await expect(
      page.getByText('Biên Bản Kiểm Định Chất Lượng Xuất Xưởng')
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /close/i }).first().click();

    // Open lazy CustomerQuotationModal & Approve
    await page.getByRole('button', { name: /Xem chi tiết & Phê duyệt/i }).click();
    await expect(page.getByText('Bảng Báo Giá Chi Tiết Dịch Vụ')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Đồng ý & Phê duyệt thực hiện/i }).click();
    await expect(page.getByText('Xác nhận phê duyệt báo giá')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận duyệt' }).click();

    await expect(
      page.getByText(/Quý khách đã phê duyệt báo giá thành công!/i)
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('UC-15 TrackingView: Quotation Reject / Revise flow submits customer feedback', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=tracking`);

    await page.getByRole('button', { name: /Xem chi tiết & Phê duyệt/i }).click({ timeout: 15000 });
    await expect(page.getByText('Bảng Báo Giá Chi Tiết Dịch Vụ')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Yêu cầu tư vấn lại \/ Từ chối/i }).click();
    await expect(page.getByText('Yêu cầu điều chỉnh phương án dịch vụ')).toBeVisible();

    await page.locator('textarea').last().fill('Nhờ cố vấn tư vấn thêm gói bảo dưỡng tiết kiệm hơn.');
    await page.getByRole('button', { name: 'Gửi yêu cầu điều chỉnh báo giá' }).click();

    await expect(
      page.getByText(/Quý khách đã yêu cầu điều chỉnh báo giá #QUO-261120-001/i)
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('UC-16 InvoicesView: filter, deferred search, lazy InvoiceDetailModal, and SePay sandbox payment', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=invoices`);

    await expect(page.getByText('INV-261120-001').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('INV-261015-002').first()).toBeVisible();

    // Filter by unpaid tab
    await page.getByRole('button', { name: /Chưa thanh toán/i }).click();
    await expect(page.getByText('INV-261120-001').first()).toBeVisible();
    await expect(page.getByText('INV-261015-002')).toHaveCount(0);

    // Search by license plate (useDeferredValue)
    const searchInput = page.getByPlaceholder(/Tìm theo Mã HĐ/i).first();
    await searchInput.fill('51A-999.99');
    await expect(page.getByText('INV-261120-001').first()).toBeVisible();

    // Open lazy InvoiceDetailModal
    await page.getByRole('button', { name: 'Chi tiết' }).first().click();
    await expect(page.getByText(/Chi tiết hóa đơn #INV-261120-001/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Lọc dầu động cơ chính hãng Honda')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng' }).first().click();

    // Open lazy CustomerPaymentModal & complete simulated SePay QR payment
    await page.getByTitle('Thanh toán trực tuyến từ xa').first().click();
    await expect(page.getByText('Thanh toán trực tuyến SePay')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('img[alt="VietQR SePay"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('CSC INV261120001')).toBeVisible();

    await page.getByRole('button', { name: /Giả lập thanh toán thành công/i }).click();
    await expect(page.getByText('Thanh toán thành công!')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('HistoryView & lazy HistoryDetailModal navigate cleanly across all 4 sub-tabs', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/customer/profile?tab=history`);

    await expect(page.getByRole('heading', { name: 'Lịch sử bảo dưỡng' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('WO-202610-088').first()).toBeVisible();

    await page.getByRole('button', { name: /Xem sổ bảo dưỡng/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /Sổ Bảo Dưỡng Điện Tử/i })
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Hạng mục & Phụ tùng/i }).click();
    await expect(page.getByText('Danh mục công việc & kỹ thuật thực hiện')).toBeVisible();

    await page.getByRole('button', { name: /Kiểm định QC & Tiến trình/i }).click();
    await expect(page.getByText('Kiểm định chất lượng xưởng (QC Passed)')).toBeVisible();

    await page.getByRole('button', { name: /Bàn giao & Bảo hành/i }).click();
    await expect(page.getByText('Chính sách bảo hành phương tiện & phụ tùng')).toBeVisible();

    await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
    await expect(page.getByText('Sổ Bảo Dưỡng Điện Tử')).toHaveCount(0);

    // Clicking "Đặt lịch mới" inside HistoryView switches to appointments tab & opens 3-step booking modal
    await page.getByRole('button', { name: /Đặt lịch mới/i }).click();
    await expect(page).toHaveURL(/\/customer\/profile\?tab=appointments/);
    await expect(page.getByRole('heading', { name: 'Đặt lịch dịch vụ & sửa chữa' })).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('NotificationBell: marks notification as read and opens lazy NotificationDetailModal', async ({
    page,
  }) => {
    const pageErrors = attachPageErrorGuard(page);
    await injectCustomerSession(page);
    await setupCustomerApiMocks(page);

    await page.goto(`${CUSTOMER_BASE_URL}/home`);

    const bellButton = page.getByRole('button', { name: 'Thông báo' });
    await expect(bellButton).toBeVisible();
    await expect(bellButton.getByText('1')).toBeVisible();

    await bellButton.click();
    await expect(page.getByText('Báo giá mới #QUO-261120-001 cần phê duyệt')).toBeVisible();

    await page.getByText('Báo giá mới #QUO-261120-001 cần phê duyệt').click();
    await expect(page.getByText(/Cố vấn Võ Minh Đạt vừa gửi bảng báo giá/i).last()).toBeVisible({
      timeout: 15000,
    });

    expect(pageErrors).toEqual([]);
  });
});
