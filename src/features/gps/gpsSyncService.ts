import { requireSupabaseClient } from '../../lib/supabase';
import type { Database } from '../../types/database';
import type { LatLngTuple } from '../../types/area';
import { calculateHaversineDistanceKm } from '../../utils/route';
import { updateRacePosition } from '../multiplayer/raceService';

export type GpsProvider = Database['public']['Tables']['gps_sessions']['Row']['provider'];
export type GpsSession = Database['public']['Tables']['gps_sessions']['Row'];
export type GpsPoint = Database['public']['Tables']['gps_points']['Row'];

export type NormalizedGpsPoint = {
  lat: number;
  lng: number;
  elevation: number | null;
  accuracy: number | null;
  recordedAt: string;
};

export type WatchGpsSessionInput = {
  sessionId: string;
  raceParticipantId?: string;
  minDistanceMeters?: number; // 기본 10m
  fallbackTimeIntervalMs?: number; // 기본 10,000ms (10초)
  minJitterMeters?: number; // 기본 3m (Jittering 방지)
  onRawPoint?: (point: NormalizedGpsPoint) => void;
  onPoint?: (point: GpsPoint, session: GpsSession) => void;
  onError?: (error: GeolocationPositionError | Error) => void;
};

function positionToPoint(position: GeolocationPosition): NormalizedGpsPoint {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    elevation: position.coords.altitude,
    accuracy: position.coords.accuracy,
    recordedAt: new Date(position.timestamp).toISOString()
  };
}

function calculateElapsedHours(previous: string, next: string) {
  const elapsedMs = new Date(next).getTime() - new Date(previous).getTime();
  return Math.max(elapsedMs / 1000 / 60 / 60, 0);
}

function calculatePaceSecondsPerKm(speedKmh: number) {
  if (speedKmh <= 0) {
    return 0;
  }

  return Math.round(3600 / speedKmh);
}

export function isBrowserGpsAvailable() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function getAppleHealthKitAvailability() {
  return {
    available: false,
    provider: 'apple_healthkit' as const,
    reason: 'Apple HealthKit requires a native iOS bridge. The PWA uses browser GPS fallback.'
  };
}

export function getGoogleFitAvailability() {
  return {
    available: false,
    provider: 'google_fit' as const,
    reason: 'Google Fit requires OAuth/native integration. The PWA uses browser GPS fallback.'
  };
}

export async function startGpsSession(input: {
  userId?: string | null;
  characterId?: string | null;
  raceId?: string | null;
  provider?: GpsProvider;
}): Promise<GpsSession> {
  const localFallbackSession: GpsSession = {
    id: `local-session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: input.userId ?? null,
    character_id: input.characterId ?? null,
    race_id: input.raceId ?? null,
    provider: input.provider ?? 'browser_geolocation',
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    total_distance: 0,
    average_pace: 0,
    elevation_gain: 0
  };

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('gps_sessions')
      .insert({
        user_id: input.userId ?? null,
        character_id: input.characterId ?? null,
        race_id: input.raceId ?? null,
        provider: input.provider ?? 'browser_geolocation',
        status: 'active'
      })
      .select('*')
      .single();

    if (error || !data) {
      console.warn('⚠️ Supabase GPS session start failed. Using local fallback session:', error);
      return localFallbackSession;
    }
    return data;
  } catch (error) {
    console.warn('⚠️ Offline/Local mode: Using local fallback GPS session:', error);
    return localFallbackSession;
  }
}

// 로컬 인메모리 세션 스토리지 (오프라인/게스트 지원)
const localSessionsStore = new Map<string, GpsSession>();
const localPointsStore = new Map<string, GpsPoint[]>();

export async function getGpsSession(sessionId: string): Promise<GpsSession> {
  if (localSessionsStore.has(sessionId)) {
    return localSessionsStore.get(sessionId)!;
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('gps_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return (
        localSessionsStore.get(sessionId) ?? {
          id: sessionId,
          user_id: null,
          character_id: null,
          race_id: null,
          provider: 'browser_geolocation',
          status: 'active',
          started_at: new Date().toISOString(),
          ended_at: null,
          total_distance: 0,
          average_pace: 0,
          elevation_gain: 0
        }
      );
    }
    return data;
  } catch {
    return (
      localSessionsStore.get(sessionId) ?? {
        id: sessionId,
        user_id: null,
        character_id: null,
        race_id: null,
        provider: 'browser_geolocation',
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
        total_distance: 0,
        average_pace: 0,
        elevation_gain: 0
      }
    );
  }
}

export async function getGpsPoints(sessionId: string): Promise<GpsPoint[]> {
  if (localPointsStore.has(sessionId)) {
    return localPointsStore.get(sessionId) ?? [];
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('gps_points')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: true });

    if (error) return localPointsStore.get(sessionId) ?? [];
    return data ?? [];
  } catch {
    return localPointsStore.get(sessionId) ?? [];
  }
}

export async function pushGpsPoint(input: {
  sessionId: string;
  point: NormalizedGpsPoint;
  raceParticipantId?: string;
}): Promise<{ point: GpsPoint; session: GpsSession }> {
  const session = await getGpsSession(input.sessionId);
  const existingPoints = await getGpsPoints(input.sessionId);
  const previousPoint = existingPoints[existingPoints.length - 1];
  const currentTuple: LatLngTuple = [input.point.lat, input.point.lng];
  const previousTuple: LatLngTuple | null = previousPoint
    ? [previousPoint.lat, previousPoint.lng]
    : null;
  const segmentDistance = previousTuple
    ? calculateHaversineDistanceKm(previousTuple, currentTuple)
    : 0;
  const elapsedHours = previousPoint
    ? calculateElapsedHours(previousPoint.recorded_at, input.point.recordedAt)
    : 0;
  const speedKmh = elapsedHours > 0 ? segmentDistance / elapsedHours : 0;
  const pace = calculatePaceSecondsPerKm(speedKmh);
  const elevationGain =
    previousPoint?.elevation !== null &&
    previousPoint?.elevation !== undefined &&
    input.point.elevation !== null
      ? Math.max(0, input.point.elevation - previousPoint.elevation)
      : 0;

  const nextDistance = session.total_distance + segmentDistance;
  const averagePace =
    nextDistance > 0
      ? Math.round(
          (new Date(input.point.recordedAt).getTime() - new Date(session.started_at).getTime()) /
            1000 /
            nextDistance
        )
      : 0;

  const localPoint: GpsPoint = {
    id: `local-point-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    session_id: input.sessionId,
    lat: input.point.lat,
    lng: input.point.lng,
    speed_kmh: Number(speedKmh.toFixed(2)),
    pace,
    elevation: input.point.elevation,
    accuracy: input.point.accuracy,
    recorded_at: input.point.recordedAt
  };

  const updatedSession: GpsSession = {
    ...session,
    total_distance: Number(nextDistance.toFixed(3)),
    average_pace: averagePace,
    elevation_gain: Number((session.elevation_gain + elevationGain).toFixed(1))
  };

  // 로컬 인메모리 스토리지 갱신
  localSessionsStore.set(input.sessionId, updatedSession);
  const currentSessionPoints = localPointsStore.get(input.sessionId) ?? [];
  localPointsStore.set(input.sessionId, [...currentSessionPoints, localPoint]);

  try {
    const client = requireSupabaseClient();
    const { data: gpsPoint, error: pointError } = await client
      .from('gps_points')
      .insert({
        session_id: input.sessionId,
        lat: input.point.lat,
        lng: input.point.lng,
        speed_kmh: Number(speedKmh.toFixed(2)),
        pace,
        elevation: input.point.elevation,
        accuracy: input.point.accuracy,
        recorded_at: input.point.recordedAt
      })
      .select('*')
      .single();

    if (!pointError && gpsPoint) {
      await client
        .from('gps_sessions')
        .update({
          total_distance: Number(nextDistance.toFixed(3)),
          average_pace: averagePace,
          elevation_gain: Number((session.elevation_gain + elevationGain).toFixed(1))
        })
        .eq('id', input.sessionId);

      return { point: gpsPoint, session: updatedSession };
    }
  } catch (error) {
    console.warn('⚠️ Supabase GPS push failed. Saved to local session cache:', error);
  }

  if (input.raceParticipantId) {
    void updateRacePosition({
      participantId: input.raceParticipantId,
      distance: updatedSession.total_distance,
      pace: updatedSession.average_pace,
      position: currentTuple
    }).catch(() => undefined);
  }

  return {
    point: localPoint,
    session: updatedSession
  };
}

/**
 * 하이브리드 GPS 추적 세션
 * - 조건 A: 이전 기록 좌표 대비 10미터 이상 이동 시 즉시 기록 (코너링 & 러닝 대응)
 * - 조건 B: 10초 경과 + 3미터 이상 이동 시 기록 (느린 걸음/정지 후 출발 보완)
 * - 3미터 미만 오차는 Jittering(튀는 GPS)으로 자동 무시
 */
export function watchBrowserGpsSession(input: WatchGpsSessionInput) {
  if (!isBrowserGpsAvailable()) {
    input.onError?.(new Error('Browser geolocation is not available on this device.'));
    return () => undefined;
  }

  const minDistanceKm = (input.minDistanceMeters ?? 10) / 1000; // 기본 10m
  const fallbackIntervalMs = input.fallbackTimeIntervalMs ?? 10_000; // 기본 10초
  const minJitterKm = (input.minJitterMeters ?? 3) / 1000; // 기본 3m

  let lastSavedTimestamp = 0;
  let lastSavedPoint: LatLngTuple | null = null;
  let isPushing = false;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const normalizedPoint = positionToPoint(position);
      const currentTuple: LatLngTuple = [normalizedPoint.lat, normalizedPoint.lng];
      const currentTime = new Date(normalizedPoint.recordedAt).getTime();

      // 지도 위 마커 실시간 부드러운 이동용 콜백
      input.onRawPoint?.(normalizedPoint);

      let shouldRecord = false;

      if (!lastSavedPoint || lastSavedTimestamp === 0) {
        // 첫 번째 GPS 좌표는 즉시 기록
        shouldRecord = true;
      } else {
        const distanceMovedKm = calculateHaversineDistanceKm(lastSavedPoint, currentTuple);
        const timeElapsedMs = currentTime - lastSavedTimestamp;

        // 1. Jittering 방지: 3m 미만 이동은 무시
        if (distanceMovedKm < minJitterKm) {
          return;
        }

        // 2. 조건 A: 10m 이상 이동했을 때 즉시 기록 (코너링 & 속도 대응)
        if (distanceMovedKm >= minDistanceKm) {
          shouldRecord = true;
        }
        // 3. 조건 B: 10초가 경과했고, 3m 이상 이동했을 때 기록 (느린 걸음 보완)
        else if (timeElapsedMs >= fallbackIntervalMs && distanceMovedKm >= minJitterKm) {
          shouldRecord = true;
        }
      }

      if (!shouldRecord || isPushing) {
        return;
      }

      isPushing = true;
      try {
        const result = await pushGpsPoint({
          sessionId: input.sessionId,
          point: normalizedPoint,
          raceParticipantId: input.raceParticipantId
        });
        lastSavedTimestamp = currentTime;
        lastSavedPoint = currentTuple;
        input.onPoint?.(result.point, result.session);
      } catch (error) {
        input.onError?.(error instanceof Error ? error : new Error('GPS sync failed.'));
      } finally {
        isPushing = false;
      }
    },
    (error) => input.onError?.(error),
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export async function completeGpsSession(sessionId: string, status: 'completed' | 'flagged' = 'completed') {
  const currentSession = await getGpsSession(sessionId);
  const updated: GpsSession = {
    ...currentSession,
    status,
    ended_at: new Date().toISOString()
  };
  localSessionsStore.set(sessionId, updated);

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('gps_sessions')
      .update({
        status,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (!error && data) return data;
  } catch (error) {
    console.warn('⚠️ Supabase GPS complete failed. Saved to local session cache:', error);
  }

  return updated;
}

export function subscribeToGpsSession(sessionId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`gps-session-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'gps_sessions',
      filter: `id=eq.${sessionId}`
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'gps_points',
      filter: `session_id=eq.${sessionId}`
    }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
