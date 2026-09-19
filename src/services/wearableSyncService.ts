import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { LatLngTuple } from '../types/area';
import type { Course } from '../types/course';
import type { CompletedActivitySummary } from '../types/activity';
import { completeActivityProgress } from '../utils/gameProgress';
import { recordExplorationDistance, saveExploredBreadcrumbs } from '../utils/fogOfWar';

export type WearableProvider = 'strava' | 'garmin' | 'apple_health' | 'samsung_health';

export interface WearableConnection {
  provider: WearableProvider;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  athleteName?: string;
  lastSyncedAt?: string;
}

export interface SyncedWearableActivity {
  id: string;
  provider: WearableProvider;
  externalActivityId: string;
  activityName: string;
  sourceDevice: string;
  distanceKm: number;
  durationSeconds: number;
  avgSpeedKmh: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainM: number;
  routeCoordinates: LatLngTuple[];
  xpEarned: number;
  syncedAt: string;
}

const STORAGE_CONNECTIONS_KEY = 'runquest_wearable_connections_v1';
const STORAGE_ACTIVITIES_KEY = 'runquest_synced_activities_v1';

export const defaultConnections: Record<WearableProvider, WearableConnection> = {
  strava: {
    provider: 'strava',
    name: 'Strava (스트라바)',
    icon: '🟧',
    color: '#fc4c02',
    isConnected: true,
    athleteName: 'Runner (Galaxy/Apple Sync)',
    lastSyncedAt: '오늘 20:30'
  },
  samsung_health: {
    provider: 'samsung_health',
    name: 'Samsung Health (삼성 헬스)',
    icon: '⌚',
    color: '#0381fe',
    isConnected: true,
    athleteName: 'Galaxy Watch User',
    lastSyncedAt: '오늘 19:15'
  },
  apple_health: {
    provider: 'apple_health',
    name: 'Apple Health (애플 헬스)',
    icon: '🍏',
    color: '#ff2d55',
    isConnected: false
  },
  garmin: {
    provider: 'garmin',
    name: 'Garmin Connect (가민)',
    icon: '🔴',
    color: '#007cc3',
    isConnected: false
  }
};

/**
 * 1. 연동된 워치 프로바이더 목록 조회
 */
export function getWearableConnections(): Record<WearableProvider, WearableConnection> {
  if (typeof window === 'undefined') return defaultConnections;
  try {
    const saved = localStorage.getItem(STORAGE_CONNECTIONS_KEY);
    return saved ? { ...defaultConnections, ...JSON.parse(saved) } : defaultConnections;
  } catch {
    return defaultConnections;
  }
}

/**
 * 2. 워치 프로바이더 연동 토글 (Connect / Disconnect)
 */
export function toggleWearableConnection(provider: WearableProvider, isConnected: boolean): Record<WearableProvider, WearableConnection> {
  const current = getWearableConnections();
  const updated = {
    ...current,
    [provider]: {
      ...current[provider],
      isConnected,
      lastSyncedAt: isConnected ? '방금 전 연동됨' : undefined
    }
  };

  try {
    localStorage.setItem(STORAGE_CONNECTIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Supabase 로그인 상태일 시 DB 동기화
  if (isSupabaseConfigured) {
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (isConnected) {
            await supabase.from('wearable_connections').upsert({
              user_id: session.user.id,
              provider,
              access_token: 'mock_bearer_token_' + Date.now(),
              auto_sync_enabled: true,
              last_synced_at: new Date().toISOString()
            } as any);
          } else {
            await supabase
              .from('wearable_connections')
              .delete()
              .eq('user_id', session.user.id)
              .eq('provider', provider);
          }
        }
      } catch {
        // Fallback to local storage
      }
    })();
  }

  return updated;
}

/**
 * 3. 최근 동기화된 운동 기록 목록 조회
 */
export async function getSyncedWearableActivities(): Promise<SyncedWearableActivity[]> {
  // Supabase DB 우선 조회
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('synced_wearable_activities')
          .select('*')
          .order('synced_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            provider: item.provider,
            externalActivityId: item.external_activity_id,
            activityName: item.activity_name,
            sourceDevice: item.source_device,
            distanceKm: Number(item.distance_km),
            durationSeconds: item.duration_seconds,
            avgSpeedKmh: Number(item.avg_speed_kmh || 0),
            avgHeartRate: item.avg_heart_rate,
            maxHeartRate: item.max_heart_rate,
            elevationGainM: item.elevation_gain_m || 0,
            routeCoordinates: item.route_coordinates,
            xpEarned: item.xp_earned,
            syncedAt: item.synced_at
          }));
        }
      }
    } catch {
      // Fallback
    }
  }

  // LocalStorage Fallback
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  return getInitialMockActivities();
}

/**
 * 4. 자동 수신된 워치 운동 기록을 DB에 저장하고 RPG 레벨업 & 안개 개척에 반영
 */
export async function saveSyncedWearableActivity(activity: SyncedWearableActivity): Promise<void> {
  // 1. RPG 보상 및 레벨업 반영
  const freeCourse: Course = {
    id: `synced-${activity.provider}-${activity.externalActivityId}`,
    areaId: 'area-bgc',
    areaName: 'Bonifacio Global City',
    name: activity.activityName,
    description: `${activity.sourceDevice} 자동 클라우드 동기화`,
    courseType: 'running',
    distanceKm: activity.distanceKm,
    estimatedTimeMin: Math.ceil(activity.durationSeconds / 60),
    difficulty: 'Easy',
    xpReward: activity.xpEarned,
    explorationReward: Math.max(2, Math.round(activity.distanceKm * 3)),
    startPoint: activity.routeCoordinates[0] ?? [14.5503, 121.0507],
    finishPoint: activity.routeCoordinates[activity.routeCoordinates.length - 1] ?? [14.5503, 121.0507],
    routeCoordinates: activity.routeCoordinates,
    checkpoints: [],
    pois: [],
    safetyNotes: ''
  };

  const summary: CompletedActivitySummary = {
    activityId: `act-${activity.externalActivityId}`,
    courseId: freeCourse.id,
    courseName: activity.activityName,
    areaName: 'Bonifacio Global City',
    difficulty: 'Easy',
    distanceKm: activity.distanceKm,
    durationSeconds: activity.durationSeconds
  };

  completeActivityProgress(freeCourse, summary);

  // 2. Fog of War 지도 개척
  if (activity.routeCoordinates.length > 0) {
    saveExploredBreadcrumbs(activity.routeCoordinates);
    recordExplorationDistance('area-bgc', activity.distanceKm);
  }

  // 3. 로컬 캐시 저장
  if (typeof window !== 'undefined') {
    try {
      const existing = await getSyncedWearableActivities();
      const updated = [activity, ...existing.filter((a) => a.id !== activity.id)].slice(0, 30);
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // 4. Supabase DB 저장
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('synced_wearable_activities').upsert({
          user_id: session.user.id,
          provider: activity.provider,
          external_activity_id: activity.externalActivityId,
          activity_name: activity.activityName,
          source_device: activity.sourceDevice,
          distance_km: activity.distanceKm,
          duration_seconds: activity.durationSeconds,
          avg_speed_kmh: activity.avgSpeedKmh,
          avg_heart_rate: activity.avgHeartRate,
          max_heart_rate: activity.maxHeartRate,
          elevation_gain_m: activity.elevationGainM,
          route_coordinates: activity.routeCoordinates as any,
          xp_earned: activity.xpEarned,
          fog_revealed: true,
          synced_at: activity.syncedAt
        } as any);
      }
    } catch {
      // DB 미존재 또는 오프라인 무시
    }
  }

  // 5. 전역 실시간 이벤트 발행 (UI 토스트 및 대시보드 갱신용)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('runquest:wearable-activity-synced', {
        detail: activity
      })
    );
  }
}

/**
 * 5. 🧪 [시뮬레이터] 워치 3.8km 완주 이벤트 자동 전송 시뮬레이션
 * 실제 워치 없이도 클라우드 웹훅이 도착한 것과 100% 동일하게 동작 검증
 */
export async function simulateSmartwatchAutoSync(
  provider: WearableProvider = 'samsung_health',
  deviceName = 'Galaxy Watch 6'
): Promise<SyncedWearableActivity> {
  const bgcTrack: LatLngTuple[] = [
    [14.5492, 121.0505],
    [14.5508, 121.0522],
    [14.5525, 121.0542],
    [14.5542, 121.0535],
    [14.5532, 121.0515],
    [14.5512, 121.0498],
    [14.5495, 121.0502]
  ];

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const distanceKm = 3.82;
  const durationSeconds = 1245; // 약 20분 45초
  const avgSpeedKmh = 11.0;
  const avgHeartRate = 156; // 버닝 보너스 구간
  const xpEarned = Math.round(distanceKm * 120) + 50; // 기본 458 + 50 = 508 XP

  const simulatedActivity: SyncedWearableActivity = {
    id: `sync-${Date.now()}`,
    provider,
    externalActivityId: `watch-auto-${Date.now()}`,
    activityName: `BGC High Street 야간 러닝 (${timeStr})`,
    sourceDevice: deviceName,
    distanceKm,
    durationSeconds,
    avgSpeedKmh,
    avgHeartRate,
    maxHeartRate: 172,
    elevationGainM: 18,
    routeCoordinates: bgcTrack,
    xpEarned,
    syncedAt: new Date().toISOString()
  };

  await saveSyncedWearableActivity(simulatedActivity);
  return simulatedActivity;
}

function getInitialMockActivities(): SyncedWearableActivity[] {
  return [
    {
      id: 'mock-act-1',
      provider: 'samsung_health',
      externalActivityId: 'samsung-9981',
      activityName: 'BGC Track 30th Street Run',
      sourceDevice: 'Galaxy Watch 6',
      distanceKm: 3.25,
      durationSeconds: 1080,
      avgSpeedKmh: 10.8,
      avgHeartRate: 152,
      maxHeartRate: 168,
      elevationGainM: 12,
      routeCoordinates: [
        [14.5503, 121.0507],
        [14.5518, 121.0525],
        [14.5535, 121.0548],
        [14.5529, 121.0512]
      ],
      xpEarned: 440,
      syncedAt: '오늘 19:15'
    }
  ];
}
