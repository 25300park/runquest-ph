import { requireSupabaseClient } from '../lib/supabase';
import type { Json } from '../types/database';
import type { GpsPoint } from '../features/gps/gpsSyncService';
import { calculateHaversineDistanceKm } from '../utils/route';

export type AntiCheatReason =
  | 'impossible_speed'
  | 'gps_teleport'
  | 'distance_spike'
  | 'inconsistent_pattern';

export type AntiCheatFinding = {
  reason: AntiCheatReason;
  severity: number;
  details: Json;
};

export type AntiCheatAnalysis = {
  cheatScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  flagged: boolean;
  xpMultiplier: number;
  findings: AntiCheatFinding[];
};

const maxWalkingSpeedKmh = 25;
const teleportDistanceKm = 0.5;
const distanceSpikeKm = 0.35;
const minimumPointCountForPattern = 6;

function elapsedSeconds(from: string, to: string) {
  return Math.max((new Date(to).getTime() - new Date(from).getTime()) / 1000, 0);
}

function scoreToMultiplier(score: number) {
  if (score >= 80) return 0;
  if (score >= 55) return 0.25;
  if (score >= 30) return 0.5;
  return 1;
}

function scoreToRiskLevel(score: number): AntiCheatAnalysis['riskLevel'] {
  if (score >= 70) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function validateGpsPoint(previous: GpsPoint | null, next: GpsPoint): AntiCheatFinding[] {
  if (!previous) {
    return [];
  }

  const findings: AntiCheatFinding[] = [];
  const segmentDistance = calculateHaversineDistanceKm(
    [previous.lat, previous.lng],
    [next.lat, next.lng]
  );
  const seconds = elapsedSeconds(previous.recorded_at, next.recorded_at);
  const speedKmh = seconds > 0 ? segmentDistance / (seconds / 3600) : next.speed_kmh;

  if (speedKmh > maxWalkingSpeedKmh) {
    findings.push({
      reason: 'impossible_speed',
      severity: Math.min(100, Math.round((speedKmh / maxWalkingSpeedKmh) * 40)),
      details: { speedKmh, thresholdKmh: maxWalkingSpeedKmh }
    });
  }

  if (seconds <= 20 && segmentDistance >= teleportDistanceKm) {
    findings.push({
      reason: 'gps_teleport',
      severity: 75,
      details: { segmentDistance, seconds, thresholdKm: teleportDistanceKm }
    });
  }

  if (seconds <= 10 && segmentDistance >= distanceSpikeKm) {
    findings.push({
      reason: 'distance_spike',
      severity: 55,
      details: { segmentDistance, seconds, thresholdKm: distanceSpikeKm }
    });
  }

  return findings;
}

export function analyzeMovement(points: GpsPoint[]): AntiCheatAnalysis {
  const findings = points.flatMap((point, index) => validateGpsPoint(points[index - 1] ?? null, point));
  const speedValues = points.map((point) => point.speed_kmh).filter((speed) => speed > 0);

  if (speedValues.length >= minimumPointCountForPattern) {
    const averageSpeed = speedValues.reduce((total, speed) => total + speed, 0) / speedValues.length;
    const highVarianceCount = speedValues.filter((speed) => Math.abs(speed - averageSpeed) > 12).length;

    if (highVarianceCount >= Math.ceil(speedValues.length * 0.4)) {
      findings.push({
        reason: 'inconsistent_pattern',
        severity: 35,
        details: { averageSpeed, highVarianceCount, sampleCount: speedValues.length }
      });
    }
  }

  const cheatScore = Math.min(100, Math.round(findings.reduce((total, finding) => total + finding.severity, 0)));

  return {
    cheatScore,
    riskLevel: scoreToRiskLevel(cheatScore),
    flagged: cheatScore >= 30,
    xpMultiplier: scoreToMultiplier(cheatScore),
    findings
  };
}

export async function storeAntiCheatReport(input: {
  sessionId?: string | null;
  userId?: string | null;
  characterId?: string | null;
  analysis: AntiCheatAnalysis;
}) {
  const client = requireSupabaseClient();
  const reasonText = input.analysis.findings.map((finding) => finding.reason).join(', ') || null;
  const reportPayload = {
    session_id: input.sessionId ?? null,
    user_id: input.userId ?? null,
    character_id: input.characterId ?? null,
    cheat_score: input.analysis.cheatScore,
    risk_level: input.analysis.riskLevel,
    flagged: input.analysis.flagged,
    reason: reasonText,
    xp_multiplier: input.analysis.xpMultiplier
  };
  const { data: report, error } = await client
    .from('anti_cheat_reports')
    .insert(reportPayload)
    .select('*')
    .single();

  if (error) throw error;

  if (input.analysis.flagged && input.analysis.findings.length > 0) {
    const { error: flaggedError } = await client.from('flagged_sessions').insert(
      input.analysis.findings.map((finding) => ({
        session_id: input.sessionId ?? null,
        user_id: input.userId ?? null,
        character_id: input.characterId ?? null,
        flag_type: finding.reason,
        severity: finding.severity,
        details: finding.details
      }))
    );

    if (flaggedError) {
      console.warn('Anti-cheat flag detail storage skipped:', flaggedError);
    }

    if (input.sessionId) {
      const { error: sessionError } = await client
        .from('gps_sessions')
        .update({ status: 'flagged' })
        .eq('id', input.sessionId);

      if (sessionError) {
        console.warn('Anti-cheat session status update skipped:', sessionError);
      }
    }
  }

  return report ?? reportPayload;
}

export async function analyzeAndStoreGpsSession(input: {
  sessionId: string;
  userId?: string | null;
  characterId?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data: points, error } = await client
    .from('gps_points')
    .select('*')
    .eq('session_id', input.sessionId)
    .order('recorded_at', { ascending: true });

  if (error) throw error;

  const analysis = analyzeMovement(points ?? []);
  const report = await storeAntiCheatReport({
    sessionId: input.sessionId,
    userId: input.userId,
    characterId: input.characterId,
    analysis
  });

  return { analysis, report };
}

export async function analyzeAndStoreGpsSessionSafely(input: {
  sessionId: string;
  userId?: string | null;
  characterId?: string | null;
}) {
  try {
    return await analyzeAndStoreGpsSession(input);
  } catch (error) {
    console.warn('Anti-cheat analysis skipped:', error);
    return null;
  }
}
