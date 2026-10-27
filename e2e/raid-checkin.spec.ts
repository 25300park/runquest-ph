import { test, expect } from '@playwright/test';

test('GPS 위치 기반 오프라인 레이드 현장 체크인 테스트', async ({ page }) => {
  // 1. 앱의 레이드 집결 페이지로 이동
  await page.goto('/crew-raid');

  // 2. 화면에 지도가 로딩되었는지 확인
  const mapElement = page.locator('.leaflet-container');
  await expect(mapElement).toBeVisible();

  // 3. 현재 위치가 BGC로 Mocking 되어 있으므로, 하단 CTA 버튼이 '🔥 현장 체크인'으로 활성화되어야 함
  const ctaButton = page.getByRole('button', { name: /현장 체크인/i });
  await expect(ctaButton).toBeVisible({ timeout: 5000 });

  // 4. 체크인 버튼 클릭 시뮬레이션
  await ctaButton.click();

  // 5. 완료 메시지 또는 보상 지급 UI가 노출되는지 검증
  const successToast = page.getByText(/체크인 완료/i);
  await expect(successToast).toBeVisible();
});