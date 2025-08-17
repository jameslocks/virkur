import { test, expect } from '@playwright/test'

test('app mounts and renders UI', async ({ page }) => {
  await page.goto('/') // baseURL handles /virkur/
  // #app should have at least one child after mount
  const app = page.locator('#app')
  await expect(app).toBeVisible()
  await expect(app.locator(':scope > *')).toHaveCountGreaterThan(0)
})
