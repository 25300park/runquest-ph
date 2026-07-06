import { requireSupabaseClient } from '../../lib/supabase';
import type { Database, Json } from '../../types/database';

export type Season = Database['public']['Tables']['seasons']['Row'];
export type GuildWar = Database['public']['Tables']['guild_wars']['Row'];

export async function createSeason(input: {
  name: string;
  startsAt?: string;
  endsAt?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('seasons')
    .insert({
      name: input.name,
      starts_at: input.startsAt ?? new Date().toISOString(),
      ends_at: input.endsAt ?? null,
      active: true
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

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

export async function registerSeasonalGuild(input: {
  seasonId: string;
  guildId: string;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('seasonal_guilds')
    .insert({
      season_id: input.seasonId,
      guild_id: input.guildId
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createGuildWar(input: {
  seasonId: string;
  guildA: string;
  guildB: string;
  duration: number;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guild_wars')
    .insert({
      season_id: input.seasonId,
      guild_a: input.guildA,
      guild_b: input.guildB,
      duration: input.duration,
      score: { [input.guildA]: 0, [input.guildB]: 0 } as Json
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateGuildWarScore(input: {
  warId: string;
  score: Record<string, number>;
}) {
  const winner =
    Object.entries(input.score).sort((first, second) => second[1] - first[1])[0]?.[0] ?? null;
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guild_wars')
    .update({
      score: input.score as Json,
      winner
    })
    .eq('id', input.warId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getSeasonalGuildLeaderboard(seasonId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('seasonal_guilds')
    .select('*')
    .eq('season_id', seasonId)
    .order('total_xp', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function subscribeToGuildWars(onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel('guild-wars-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seasonal_guilds' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_wars' }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
