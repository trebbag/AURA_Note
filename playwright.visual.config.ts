import { defineConfig, devices } from '@playwright/test';

const port = process.env.AURA_NOTE_VISUAL_WEB_PORT ?? '3260';
const apiPort = process.env.AURA_NOTE_VISUAL_API_PORT ?? '3360';
const baseURL = `http://127.0.0.1:${port}`;
const apiBaseURL = `http://127.0.0.1:${apiPort}/api/v1`;

export default defineConfig({
  testDir: 'apps/web/visual',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2
    }
  },
  fullyParallel: false,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 }
  },
  webServer: [
    {
      command: `AURA_NOTE_AUTH_MODE=local_demo PORT=${apiPort} pnpm --filter @aura-note/api exec tsx src/main.ts`,
      url: `${apiBaseURL}/health`,
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: `AURA_NOTE_API_BASE_URL=${apiBaseURL} NEXT_PUBLIC_AURA_NOTE_API_BASE_URL=${apiBaseURL} pnpm --filter @aura-note/web exec next dev -p ${port} -H 127.0.0.1`,
      url: `${baseURL}/status`,
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
});
