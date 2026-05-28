import { defineConfig, devices } from '@playwright/test';

const port = process.env.AURA_NOTE_WEB_E2E_PORT ?? '3200';
const apiPort = process.env.AURA_NOTE_API_E2E_PORT ?? '3300';
const baseURL = `http://127.0.0.1:${port}`;
const apiBaseURL = `http://127.0.0.1:${apiPort}/api/v1`;

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
  webServer: [
    {
      command: `PORT=${apiPort} pnpm --filter @aura-note/api exec tsx src/main.ts`,
      url: `${apiBaseURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: `AURA_NOTE_API_BASE_URL=${apiBaseURL} NEXT_PUBLIC_AURA_NOTE_API_BASE_URL=${apiBaseURL} pnpm --filter @aura-note/web exec next dev -p ${port} -H 127.0.0.1`,
      url: `${baseURL}/status`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
