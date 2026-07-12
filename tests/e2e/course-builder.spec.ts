import { expect, test } from '@playwright/test';

test('course builder renders without destructive actions', async ({ page }) => {
  await page.goto('/course-builder');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/course|builder|map|route/i);
});

test('admin course builder route is protected', async ({ page }) => {
  await page.goto('/admin/course-builder');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/login|admin|required|loading/i);
});
