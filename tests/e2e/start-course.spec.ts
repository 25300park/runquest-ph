import { expect, test } from '@playwright/test';

test('run page does not silently load mock route without selected course state', async ({ page }) => {
  await page.goto('/run');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('body')).not.toContainText(/mock route/i);
});
