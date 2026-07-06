import { requireSupabaseClient } from '../../lib/supabase';
import type { Database } from '../../types/database';

export type LeaderboardRegion =
  Database['public']['Tables']['leaderboard']['Row']['region'];
export type LeaderboardRow = Database['public']['Tables']['leaderboard']['Row'];

export function calculateLeaderboardScore(input: {
  distanceKm: number;
  xp: number;
  level: number;
  streakDays: number;
}) {
  const levelBonus = input.level * 25;
  const streakBonus = input.streakDays * 10;
  return Number((input.distanceKm + input.xp + levelBonus + streakBonus).toFixed(2));
}

export async function getLeaderboard(region: LeaderboardRegion = 'Global') {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('leaderboard')
    .select('*')
    .eq('region', region)
    .order('weekly_score', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateLeaderboardScore(input: {
  characterId: string;
  region?: LeaderboardRegion;
  totalDistance: number;
  totalXp: number;
  level: number;
  streakDays: number;
}) {
  const client = requireSupabaseClient();
  const region = input.region ?? 'Global';
  const weeklyScore = calculateLeaderboardScore({
    distanceKm: input.totalDistance,
    xp: input.totalXp,
    level: input.level,
    streakDays: input.streakDays
  });
  const { data: existing, error: existingError } = await client
    .from('leaderboard')
    .select('*')
    .eq('character_id', input.characterId)
    .eq('region', region)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const payload = {
    character_id: input.characterId,
    region,
    total_distance: input.totalDistance,
    total_xp: input.totalXp,
    level: input.level,
    streak_bonus: input.streakDays * 10,
    weekly_score: weeklyScore,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    const { error } = await client.from('leaderboard').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await client.from('leaderboard').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

export function subscribeToLeaderboard(region: LeaderboardRegion, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`leaderboard-${region}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
        filter: `region=eq.${region}`
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
