import { requireSupabaseClient } from '../../lib/supabase';
import type { Database, Json } from '../../types/database';
import type { LatLngTuple } from '../../types/area';

export type RaceSession = Database['public']['Tables']['race_sessions']['Row'];
export type RaceParticipant = Database['public']['Tables']['race_participants']['Row'];

export async function createRaceSession(courseId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('race_sessions')
    .insert({
      course_id: courseId,
      status: 'waiting'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function startRaceSession(raceId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('race_sessions')
    .update({
      status: 'running',
      start_time: new Date().toISOString()
    })
    .eq('id', raceId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function joinRace(input: {
  raceId: string;
  userId?: string | null;
  characterId?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('race_participants')
    .insert({
      race_id: input.raceId,
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateRacePosition(input: {
  participantId: string;
  distance: number;
  pace: number;
  position: LatLngTuple;
}) {
  const client = requireSupabaseClient();
  const positionPayload: Json = {
    lat: input.position[0],
    lng: input.position[1],
    updated_at: new Date().toISOString()
  };
  const { data, error } = await client
    .from('race_participants')
    .update({
      distance: input.distance,
      pace: input.pace,
      position: positionPayload
    })
    .eq('id', input.participantId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function finishRaceParticipant(participantId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('race_participants')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', participantId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getLiveRaceLeaderboard(raceId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('race_participants')
    .select('*')
    .eq('race_id', raceId)
    .order('distance', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function subscribeToRace(raceId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`race-${raceId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'race_sessions', filter: `id=eq.${raceId}` },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'race_participants', filter: `race_id=eq.${raceId}` },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
