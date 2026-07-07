import { requireSupabaseClient } from '../lib/supabase';

export type GlobalRegion = 'Philippines' | 'Korea' | 'Global';

export async function getGlobalLeaderboard(region: GlobalRegion = 'Global') {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('leaderboard_global')
    .select('*')
    .eq('region', region)
    .order('weekly_score', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function updateGlobalLeaderboard(input: {
  userId?: string | null;
  characterId?: string | null;
  region?: GlobalRegion;
  totalDistance: number;
  totalXp: number;
  level: number;
}) {
  if (!input.characterId) return null;
  const client = requireSupabaseClient();
  const region = input.region ?? 'Global';
  const weeklyScore = input.totalDistance + input.totalXp * 2 + input.level * 10;
  const payload = {
    user_id: input.userId ?? null,
    character_id: input.characterId,
    region,
    timezone: region === 'Korea' ? 'Asia/Seoul' : region === 'Philippines' ? 'Asia/Manila' : 'UTC',
    total_distance: input.totalDistance,
    total_xp: input.totalXp,
    level: input.level,
    weekly_score: weeklyScore,
    season_score: weeklyScore,
    updated_at: new Date().toISOString()
  };
  const { data: existing } = await client
    .from('leaderboard_global')
    .select('id')
    .eq('character_id', input.characterId)
    .eq('region', region)
    .maybeSingle();

  if (existing) {
    const { error } = await client.from('leaderboard_global').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await client.from('leaderboard_global').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}
