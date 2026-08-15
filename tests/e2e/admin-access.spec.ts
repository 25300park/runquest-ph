import { expect, test } from '@playwright/test';

test('admin dashboard blocks non-admin anonymous session', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page).toHaveURL(/\/login/);
});

test('unauthorized users are redirected from admin test agent to login', async ({ page }) => {
  await page.goto('/admin/test-agent');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('body')).not.toHaveText('');
});

test('authorized admin can open admin test agent page', async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD, 'Admin credentials not configured.');

  await page.goto('/login');
  await page.getByTestId('login-email').fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByTestId('login-password').fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByTestId('login-submit').click();
  await page.waitForLoadState('networkidle').catch(() => undefined);

  await page.goto('/admin/test-agent');
  await expect(page.getByTestId('admin-test-agent-page')).toBeVisible();
  await expect(page.locator('body')).not.toHaveText('');
});
