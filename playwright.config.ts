import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1, // 실패 시 1번 더 재시도 (자동화의 핵심)
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // 실패했을 때 화면 캡처 및 로그 남기기
  },
  projects: [
    {
      name: 'Mobile Safari (BGC Mocking)',
      use: { 
        ...devices['iPhone 14'], // 아이폰 14 환경 시뮬레이션
        geolocation: { latitude: 14.5523, longitude: 121.0503 }, // BGC High Street 좌표 고정
        permissions: ['geolocation'], // 위치 정보 동의 팝업 자동 패스
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});