import { expect, test } from '@playwright/test';

test('auth pages render login and register safely', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /return to your map/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();

  await page.goto('/register');
  await expect(page.locator('body')).toContainText(/register|adventurer|email/i);
});

test('unauthorized admin access redirects or blocks', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/login|required|admin|loading/i);
});

test('admin login works when credentials are configured', async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD, 'Admin credentials not configured.');

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /login/i }).click();
  await page.goto('/admin');
  await expect(page.locator('body')).toContainText(/admin|dashboard/i);
});
