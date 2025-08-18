// playwright.config.ts
import { defineConfig } from '@playwright/test'

const PORT = 4173
const ROOT = `http://localhost:${PORT}`
const BASE = `${ROOT}/virkur/`

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
