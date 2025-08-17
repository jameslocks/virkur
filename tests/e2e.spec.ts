import { test, expect } from '@playwright/test'

test('app mounts and renders UI', async ({ page }) => {
  // vite preview baseURL is set in playwright.config.ts, so "/" maps to /virkur/
  await page.goto('/')

  const app = page.locator('#app')
  await expect(app).toBeVisible()

  // Assert that at least one child was rendered inside #app
  const childCount = await app.locator(':scope > *').count()
  expect(childCount).toBeGreaterThan(0)
})
