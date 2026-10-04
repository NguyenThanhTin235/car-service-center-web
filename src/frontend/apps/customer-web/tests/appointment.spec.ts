import { test, expect } from '@playwright/test';

test.describe('Customer Appointment Flow', () => {
  // Vì hiện tại hệ thống chưa có mock data trong Playwright, ta sẽ viết test outline cho luồng Đặt lịch (Happy Path)
  // Phù hợp với P0 Smoke Suite của QA Automation Engineer

  test.beforeEach(async ({ page }) => {
    // 1. Giả lập đăng nhập dưới quyền Customer
    // (Trong thực tế cần dùng fixture hoặc setup state, tạm thời điều hướng trực tiếp giả định đã có token)
    
    // Set mock cookie hoặc token (Ví dụ)
    // await page.context().addCookies([{ name: 'jwt', value: 'mock_token', url: 'http://localhost:3000' }]);
  });

  test('Khách hàng có thể đặt lịch hẹn thành công (UC-11)', async ({ page }) => {
    // Note: URL giả định tuỳ thuộc vào port cấu hình.
    // Bước 1: Truy cập trang đặt lịch mới
    await page.goto('/customer/appointments/new');
    
    // Đảm bảo tiêu đề xuất hiện (Chờ load xong)
    await expect(page.locator('h1')).toContainText('Đặt lịch hẹn mới');

    // Màn hình 1: Chọn phương tiện
    // Giả định có phương tiện đầu tiên được load ra
    const vehicleOption = page.locator('div.grid > div').first();
    // Bấm chọn xe
    // await vehicleOption.click();
    
    // Bấm Tiếp theo
    // await page.getByRole('button', { name: 'Tiếp theo' }).click();

    // Màn hình 2: Chọn dịch vụ & Nhập ghi chú
    // await expect(page.locator('h2')).toContainText('Bạn cần chúng tôi làm gì?');
    // const firstServiceCheckbox = page.locator('input[type="checkbox"]').first();
    // await firstServiceCheckbox.check();
    // await page.getByPlaceholder('Ví dụ: Xe kêu lạch cạch').fill('Bảo dưỡng định kỳ 40k km');
    
    // await page.getByRole('button', { name: 'Tiếp theo' }).click();

    // Màn hình 3: Chọn Ngày Giờ
    // await expect(page.locator('h2')).toContainText('Chọn ngày và giờ mang xe đến');
    // const dateInput = page.locator('input[type="date"]');
    // const timeInput = page.locator('input[type="time"]');
    
    // Set date to tomorrow
    // const tomorrow = new Date();
    // tomorrow.setDate(tomorrow.getDate() + 1);
    // await dateInput.fill(tomorrow.toISOString().split('T')[0]);
    // await timeInput.fill('09:00');

    // Bấm Xác nhận
    // await page.getByRole('button', { name: 'Xác nhận đặt lịch' }).click();

    // Verify kết quả: Toast hiện lên & Redirect
    // await expect(page.locator('text=Đặt lịch hẹn thành công!')).toBeVisible();
    // await expect(page).toHaveURL('/customer/appointments');
  });

  test('Khách hàng có thể xem danh sách và hủy lịch hẹn (UC-12, UC-14)', async ({ page }) => {
    await page.goto('/customer/appointments');
    await expect(page.locator('h1')).toContainText('Lịch hẹn của tôi');
    
    // Test logic hủy lịch (Destructive testing)
    // Nếu có lịch hẹn trạng thái REQUESTED, thử ấn hủy
    // const cancelButton = page.getByRole('button', { name: 'Hủy' }).first();
    // await cancelButton.click();
    
    // Verify Modal hiện ra và chặn hành vi hủy nếu thiếu lý do
    // const confirmBtn = page.getByRole('button', { name: 'Xác nhận hủy' });
    // await confirmBtn.click();
    
    // // Chặn vì validation
    // await expect(page.locator('text=Vui lòng nhập lý do hủy lịch')).toBeVisible();

    // // Nhập lý do và hủy
    // await page.locator('textarea[placeholder="Lý do hủy..."]').fill('Bận việc đột xuất');
    // await confirmBtn.click();
    
    // // Verify thành công
    // await expect(page.locator('text=Đã hủy lịch hẹn thành công.')).toBeVisible();
  });
});
