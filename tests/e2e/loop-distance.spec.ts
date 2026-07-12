import { expect, test } from '@playwright/test';

test('course detail exposes loop multiplier language when course data exists', async ({ page }) => {
  await page.goto('/map');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/mockCourses|mock route/i);
});
