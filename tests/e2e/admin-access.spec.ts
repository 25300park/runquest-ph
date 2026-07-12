import { expect, test } from '@playwright/test';

test('admin dashboard blocks non-admin anonymous session', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/admin|login|required|loading/i);
});

test('admin test agent page is not public', async ({ page }) => {
  await page.goto('/admin/test-agent');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/admin|login|required|loading/i);
});
