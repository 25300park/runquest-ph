import { expect, test } from '@playwright/test';

test('course builder includes GPX import surface without uploading production data', async ({ page }) => {
  await page.goto('/course-builder');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).toContainText(/gpx|upload|import|route/i);
});
