import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173/virkur/',
    headless: true,
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
