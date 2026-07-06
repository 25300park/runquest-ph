import { requireSupabaseClient } from '../../lib/supabase';
import type { Database, Json } from '../../types/database';
import type { LatLngTuple } from '../../types/area';

export type MapZone = Database['public']['Tables']['map_zones']['Row'];
export type ZoneActivity = Database['public']['Tables']['zone_activity']['Row'];

export async function createMapZone(input: {
  name: string;
  coordinates: LatLngTuple[];
  region: string;
  controllingGuild?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('map_zones')
    .insert({
      name: input.name,
      coordinates: input.coordinates as unknown as Json,
      region: input.region,
      controlling_guild: input.controllingGuild ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMapZones(region?: string) {
  const client = requireSupabaseClient();
  const query = client.from('map_zones').select('*').order('name');
  const { data, error } = region ? await query.eq('region', region) : await query;

  if (error) throw error;
  return data ?? [];
}

export function calculateZoneActivityScore(input: {
  distanceKm: number;
  runs: number;
  guildInfluence: number;
}) {
  return Number((input.distanceKm * 10 + input.runs * 25 + input.guildInfluence).toFixed(2));
}

export async function contributeZoneActivity(input: {
  zoneId: string;
  userId?: string | null;
  characterId?: string | null;
  distanceKm: number;
  runs?: number;
  guildInfluence?: number;
}) {
  const client = requireSupabaseClient();
  const activityScore = calculateZoneActivityScore({
    distanceKm: input.distanceKm,
    runs: input.runs ?? 1,
    guildInfluence: input.guildInfluence ?? 0
  });
  const { data, error } = await client
    .from('zone_activity')
    .insert({
      zone_id: input.zoneId,
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null,
      activity_score: activityScore
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateZoneControl(input: {
  zoneId: string;
  controllingGuild: string | null;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('map_zones')
    .update({ controlling_guild: input.controllingGuild })
    .eq('id', input.zoneId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMapBattles(onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel('map-battle-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'map_zones' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'zone_activity' }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
