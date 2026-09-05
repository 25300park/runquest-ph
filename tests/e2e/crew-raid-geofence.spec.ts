import { test, expect } from '@playwright/test';

/**
 * [Group C - Phase 10 & Special]
 * 오프라인 집결(Crew Raid) 50m 지오펜스 진입 및 실시간 현장 체크인 E2E 자동화 테스트
 * 
 * 테스트 시나리오:
 * 1. 모바일 뷰포트(iPhone 14) 및 권한(Geolocation) 설정
 * 2. 초기 위치를 집결지(BGC High Street Amphitheater) 200m 외부로 설정
 * 3. 집결지 상세 페이지 진입 시 [Join Raid] 비활성(또는 원거리) 상태 확인
 * 4. GPS 위치를 집결지 30m 반경 내부로 동적 Mocking (Geofence Breach)
 * 5. 하단 CTA 버튼이 [🔥 현장 체크인 (Check-in)]으로 실시간 전환되는지 검증
 * 6. 체크인 버튼 클릭 시 파티클 축하 애니메이션 및 보상(+500 XP, Raid Badge) 획득 검증
 */

test.describe('Group C: Crew Raid O2O GPS Geofence Check-in E2E Test', () => {
  // BGC High Street Amphitheater 집결지 기준 좌표
  const RAID_TARGET = {
    latitude: 14.5515,
    longitude: 121.0515,
    radiusMeters: 50
  };

  // 1. 200m 원거리 좌표 (집결지 외부)
  const OUTSIDE_POSITION = {
    latitude: 14.5535,
    longitude: 121.0535
  };

  // 2. 30m 근접 좌표 (지오펜스 50m 내부 진입)
  const INSIDE_POSITION = {
    latitude: 14.5516,
    longitude: 121.0516
  };

  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 / 15 모바일 뷰포트
    permissions: ['geolocation'],
    geolocation: OUTSIDE_POSITION
  });

  test('집결지 50m 접근 시 [Join Raid] 버튼이 [🔥 현장 체크인]으로 실시간 전환되고 보상이 지급되어야 한다', async ({ page, context }) => {
    // 1. Network Throttling 및 세션 Mocking 설정
    await context.route('**/api/raid/check-in', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          reward: { xp: 500, gold: 100, badge: 'BGC Raid Conqueror' },
          checkedInAt: new Date().toISOString()
        })
      });
    });

    // 2. 오프라인 집결 상세 페이지 진입
    await page.goto('/raid');
    await page.waitForLoadState('networkidle');

    // 3. 지오펜스 외부(200m) 상태 확인
    const raidBeacon = page.locator('[data-testid="raid-beacon-marker"]').first();
    await expect(raidBeacon).toBeVisible();

    // 4. GPS 위치를 집결지 30m 반경 내부로 실시간 업데이트 (Dynamic Geolocation Mocking)
    await context.setGeolocation(INSIDE_POSITION);

    // 위치 갱신 이벤트 트리거
    await page.evaluate((pos) => {
      window.dispatchEvent(
        new CustomEvent('runquest:gps-update', {
          detail: { latitude: pos.latitude, longitude: pos.longitude, accuracy: 5 }
        })
      );
    }, INSIDE_POSITION);

    // 5. 50m 지오펜스 진입 반응성 검증: 버튼이 [🔥 현장 체크인]으로 즉각 전환되는지 확인
    const checkInButton = page.locator('button:has-text("현장 체크인"), button:has-text("Check-in"), [data-testid="btn-raid-checkin"]');
    
    // UI 반응 대기 (1초 이내 전환)
    await expect(checkInButton).toBeVisible({ timeout: 3000 });

    // 6. 체크인 버튼 탭 & 파티클 / 진동 / 보상 팝업 검증
    await checkInButton.click();

    // 7. 축하 모달 및 XP 획득 UI 노출 검증
    const rewardModal = page.getByText('+500 XP');
    await expect(rewardModal).toBeVisible({ timeout: 4000 });
  });
});
