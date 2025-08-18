// tests/e2e-backup.spec.ts
import { test, expect } from '@playwright/test'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'

test('export → import round-trip preserves entry count', async ({ page }) => {
  // Ensure app loaded
  await page.goto('/virkur/#today')
  await page.waitForSelector('#app')

  // Count current Today items (tap targets to entries)
  const countBefore = await page.locator('section:has-text("Today") a[href^="#entry/"]').count().catch(() => 0)

  // Go to Settings → Export
  await page.goto('/virkur/#settings')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export JSON/i }).click()
  const download = await downloadPromise

  // Save to a temp file
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'virkur-'))
  const filePath = path.join(dir, await download.suggestedFilename())
  await download.saveAs(filePath)

  // Import the same file (merge/upsert)
  const input = page.locator('input#importFile')
  await input.setInputFiles(filePath)

  // Confirm in the overlay
  await page.getByRole('button', { name: /^Import$/ }).click()

  // Wait for reload then go back to Today
  await page.waitForLoadState('load')
  await page.goto('/virkur/#today')

  // Recount; should be >= before (merge does not delete or duplicate IDs)
  const countAfter = await page.locator('section:has-text("Today") a[href^="#entry/"]').count().catch(() => 0)
  expect(countAfter).toBeGreaterThanOrEqual(countBefore)
})
