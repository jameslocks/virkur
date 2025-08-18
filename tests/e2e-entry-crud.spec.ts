// tests/e2e-entry-crud.spec.ts
import { test, expect } from '@playwright/test'

test('add → edit → delete → undo an entry', async ({ page }) => {
  // Go to app
  await page.goto('/virkur/')
  await page.waitForSelector('#app')

  // Add a Push-ups entry
  await page.goto('/virkur/#add')
  // Pick activity
  await page.getByLabel(/Activity/i).selectOption({ label: /Push-?ups/i })

  // Fill sets/reps
  await page.getByLabel(/Sets/i).fill('2')
  await page.getByLabel(/Reps per set/i).fill('11')
  await page.getByRole('button', { name: /^Save$/ }).click()

  // Land back on Today; verify tile exists
  await expect(page).toHaveURL(/#today/)
  const pushupsTile = page.getByRole('link', { name: /Push-?ups/i }).first()
  await expect(pushupsTile).toBeVisible()

  // Open entry for edit
  await pushupsTile.click()

  // Change reps to 12 and save
  await page.getByLabel(/Reps per set/i).fill('12')
  await page.getByRole('button', { name: /^Save$/ }).click()
  await expect(page).toHaveURL(/#today/)

  // Open again and delete
  const pushupsTile2 = page.getByRole('link', { name: /Push-?ups/i }).first()
  await pushupsTile2.click()

  // Confirm the delete dialog and click Delete
  page.once('dialog', d => d.accept())
  await page.getByRole('button', { name: /^Delete$/ }).click()

  // Undo from toast
  const undo = page.getByRole('button', { name: /Undo/i })
  await expect(undo).toBeVisible()
  await undo.click()

  // Should route back to entry; then back to Today and verify tile visible
  await expect(page).toHaveURL(/#entry\//)
  await page.goto('/virkur/#today')
  await expect(page.getByRole('link', { name: /Push-?ups/i }).first()).toBeVisible()
})
