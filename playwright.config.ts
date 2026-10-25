import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

// The production build end to end, in Chromium, on the local backend (no Firebase). Locally it
// drives the system's Chromium: CHROMIUM_PATH points elsewhere, or empty for Playwright's own.
const chromium = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The interface follows the browser's language: the tests read the Portuguese one.
    locale: 'pt-BR',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromium ? { executablePath: chromium } : {}
      }
    }
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    env: { VITE_BACKEND: 'local' },
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
