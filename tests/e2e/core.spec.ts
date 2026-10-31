import { test, expect } from '@playwright/test'

// E2E-1: Anonymous home page renders with header, hero, and footer.
// Verifies the public catalog landing experience works end-to-end.
test('anonymous home page renders core structure', async ({ page }) => {
  await page.goto('/')
  // Header brand
  await expect(page.getByRole('link', { name: /streamora home/i })).toBeVisible()
  // Nav links
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible()
  // Hero heading
  await expect(
    page.getByRole('heading', { name: /free, customizable tv from the iptv-org catalog/i }),
  ).toBeVisible()
  // Footer present
  await expect(page.getByRole('contentinfo')).toBeVisible()
  // Sign in / sign up visible (anonymous)
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
})

// E2E-2: Browse page renders filter bar.
test('browse page renders filter bar', async ({ page }) => {
  await page.goto('/browse')
  await expect(page.getByLabel('Search')).toBeVisible()
  await expect(page.getByLabel('Country')).toBeVisible()
  await expect(page.getByLabel('Category')).toBeVisible()
})

// E2E-3: Sign-up flow creates a user and redirects to home.
test('sign-up flow creates a user', async ({ page, request }) => {
  const email = `e2e-${Date.now()}@streamora.test`
  await page.goto('/signup')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill('e2e-test-pass-123')
  await page.getByLabel(/name/i).fill('E2E Test')
  await page.getByRole('button', { name: /sign up|create account/i }).click()
  // Should land on home page after successful signup
  await expect(page).toHaveURL(/\/$|\/\?callbackUrl/)
  // Header should now show "Sign out" instead of "Sign in"
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible({ timeout: 15_000 })
})

// E2E-4: Anonymous user cannot reach /admin and is redirected to /login.
test('anonymous user redirected from /admin to /login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})

// E2E-5: Anonymous user cannot reach /dashboard and is redirected to /login.
test('anonymous user redirected from /dashboard to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

// E2E-6: Catalog API returns channel data.
test('catalog API returns channels', async ({ request }) => {
  const res = await request.get('/api/catalog/channels?pageSize=5')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.items).toBeInstanceOf(Array)
  expect(body.total).toBeGreaterThan(0)
  expect(body.pageSize).toBe(5)
})
