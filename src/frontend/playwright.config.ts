import { defineConfig, devices } from '@playwright/test';

// Ambient declaration to support process.env across all TS setups without requiring module imports
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Playwright E2E Configuration for Car Service Center
 * Hỗ trợ kiểm thử cả Customer Web (:3000) và Internal Web (:3001)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Chạy tuần tự để bảo toàn thứ tự giao dịch dữ liệu
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    bypassCSP: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:customer',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npm run dev:internal',
      port: 3001,
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
