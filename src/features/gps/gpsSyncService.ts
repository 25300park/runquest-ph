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
}) {
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

  if (error) throw error;
  return data;
}

export async function getGpsSession(sessionId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('gps_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function getGpsPoints(sessionId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('gps_points')
    .select('*')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function pushGpsPoint(input: {
  sessionId: string;
  point: NormalizedGpsPoint;
  raceParticipantId?: string;
}) {
  const client = requireSupabaseClient();
  const [session, existingPoints] = await Promise.all([
    getGpsSession(input.sessionId),
    getGpsPoints(input.sessionId)
  ]);
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

  if (pointError) throw pointError;

  const nextDistance = session.total_distance + segmentDistance;
  const averagePace = nextDistance > 0
    ? Math.round((new Date(input.point.recordedAt).getTime() - new Date(session.started_at).getTime()) / 1000 / nextDistance)
    : 0;
  const { data: updatedSession, error: sessionError } = await client
    .from('gps_sessions')
    .update({
      total_distance: Number(nextDistance.toFixed(3)),
      average_pace: averagePace,
      elevation_gain: Number((session.elevation_gain + elevationGain).toFixed(1))
    })
    .eq('id', input.sessionId)
    .select('*')
    .single();

  if (sessionError) throw sessionError;

  if (input.raceParticipantId) {
    await updateRacePosition({
      participantId: input.raceParticipantId,
      distance: updatedSession.total_distance,
      pace: updatedSession.average_pace,
      position: currentTuple
    });
  }

  return {
    point: gpsPoint,
    session: updatedSession
  };
}

export function watchBrowserGpsSession(input: WatchGpsSessionInput) {
  if (!isBrowserGpsAvailable()) {
    input.onError?.(new Error('Browser geolocation is not available on this device.'));
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        const result = await pushGpsPoint({
          sessionId: input.sessionId,
          point: positionToPoint(position),
          raceParticipantId: input.raceParticipantId
        });
        input.onPoint?.(result.point, result.session);
      } catch (error) {
        input.onError?.(error instanceof Error ? error : new Error('GPS sync failed.'));
      }
    },
    (error) => input.onError?.(error),
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export async function completeGpsSession(sessionId: string, status: 'completed' | 'flagged' = 'completed') {
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

  if (error) throw error;
  return data;
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
