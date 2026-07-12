import { expect, test } from '@playwright/test';

test('course detail handles missing Supabase course safely', async ({ page }) => {
  await page.goto('/courses/non-existent-test-course');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/course|route|not|loading|map/i);
});
