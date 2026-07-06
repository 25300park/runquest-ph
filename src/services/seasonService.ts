import { requireSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/database';

export type SeasonRow = Database['public']['Tables']['seasons']['Row'];
export type EventRow = Database['public']['Tables']['events']['Row'];

export async function getActiveSeason() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('seasons')
    .select('*')
    .eq('active', true)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureActiveSeason() {
  const existing = await getActiveSeason();
  if (existing) return existing;

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('seasons')
    .insert({
      name: `RunQuest Season ${new Date().getFullYear()}`,
      active: true
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function listActiveEvents() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('events')
    .select('*')
    .eq('active', true)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateSeasonScore(input: {
  userId?: string | null;
  characterId?: string | null;
  xp: number;
  distanceKm: number;
}) {
  if (!input.characterId) {
    return null;
  }

  const season = await ensureActiveSeason();
  const client = requireSupabaseClient();
  const { data: existing, error: existingError } = await client
    .from('season_scores')
    .select('*')
    .eq('season_id', season.id)
    .eq('character_id', input.characterId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await client
      .from('season_scores')
      .update({
        total_xp: existing.total_xp + input.xp,
        total_distance: existing.total_distance + input.distanceKm,
        rank_score: existing.rank_score + input.xp * 2 + input.distanceKm,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await client
    .from('season_scores')
    .insert({
      season_id: season.id,
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null,
      total_xp: input.xp,
      total_distance: input.distanceKm,
      rank_score: input.xp * 2 + input.distanceKm
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export function subscribeToSeasons(onChange: () => void) {
  const client = requireSupabaseClient();
  let debounceTimer: number | undefined;
  const debouncedChange = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onChange, 500);
  };
  const channel = client
    .channel('season-events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, debouncedChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, debouncedChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'season_scores' }, debouncedChange)
    .subscribe();

  return () => {
    window.clearTimeout(debounceTimer);
    client.removeChannel(channel);
  };
}
