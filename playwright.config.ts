import { defineConfig, devices } from '@playwright/test';

const port = process.env.AURA_NOTE_WEB_E2E_PORT ?? '3200';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'apps/web/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `pnpm --filter @aura-note/web exec next dev -p ${port} -H 127.0.0.1`,
    url: `${baseURL}/status`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
