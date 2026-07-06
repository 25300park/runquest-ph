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
  const levelBonus = input.level * 10;
  const streakBonus = input.streakDays * 10;
  return Number((input.distanceKm * 1 + input.xp * 2 + levelBonus + streakBonus).toFixed(2));
}

export async function getLeaderboard(region: LeaderboardRegion = 'Global') {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('leaderboard')
    .select('*')
    .eq('region', region)
    .order('weekly_score', { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateLeaderboardScore(input: {
  characterId: string;
  userId?: string | null;
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
    user_id: input.userId ?? null,
    region,
    total_distance: input.totalDistance,
    distance_total: input.totalDistance,
    total_xp: input.totalXp,
    xp_total: input.totalXp,
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
  let debounceTimer: number | undefined;
  const debouncedChange = () => {
    if (typeof window === 'undefined') {
      onChange();
      return;
    }

    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onChange, 500);
  };
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
      debouncedChange
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Leaderboard realtime unavailable:', status);
      }
    });

  return () => {
    if (typeof window !== 'undefined') {
      window.clearTimeout(debounceTimer);
    }
    client.removeChannel(channel);
  };
}
