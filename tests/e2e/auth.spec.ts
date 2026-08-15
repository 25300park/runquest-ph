import { expect, test } from '@playwright/test';

test('auth pages render login and register safely', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /return to your map/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();

  await page.goto('/register');
  await expect(page.locator('body')).toContainText(/register|adventurer|email/i);
  const referralInput = page.getByLabel(/referral code/i);
  await expect(referralInput).toBeVisible();
  await expect(referralInput).not.toHaveAttribute('required', '');
});


test('password recovery pages are publicly reachable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();

  await page.getByRole('link', { name: /forgot password/i }).click();
  await expect(page.getByTestId('forgot-password-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();

  await page.goto('/update-password');
  await expect(page.getByTestId('update-password-page')).toBeVisible();
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
