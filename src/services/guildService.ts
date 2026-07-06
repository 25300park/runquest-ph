import { requireSupabaseClient } from '../lib/supabase';

export async function createGuild(input: {
  name: string;
  leaderId?: string | null;
  characterId?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data: guild, error } = await client
    .from('guilds')
    .insert({
      name: input.name,
      leader_id: input.leaderId ?? null
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await joinGuild({
    guildId: guild.id,
    userId: input.leaderId ?? null,
    characterId: input.characterId ?? null,
    role: 'leader'
  });

  return guild;
}

export async function joinGuild(input: {
  guildId: string;
  userId?: string | null;
  characterId?: string | null;
  role?: 'leader' | 'officer' | 'member';
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guild_members')
    .insert({
      guild_id: input.guildId,
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null,
      role: input.role ?? 'member'
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getGuildLeaderboard() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guilds')
    .select('*')
    .order('shared_xp', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function contributeToGuild(input: {
  characterId: string;
  xp: number;
  distanceKm: number;
}) {
  const client = requireSupabaseClient();
  const { data: memberships, error } = await client
    .from('guild_members')
    .select('*')
    .eq('character_id', input.characterId);

  if (error) {
    throw error;
  }

  await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const { error: memberError } = await client
        .from('guild_members')
        .update({
          contributed_xp: membership.contributed_xp + input.xp,
          contributed_distance: membership.contributed_distance + input.distanceKm,
          contribution_score:
            membership.contribution_score + input.xp * 2 + input.distanceKm
        })
        .eq('id', membership.id);

      if (memberError) {
        throw memberError;
      }

      const { data: guild, error: guildFetchError } = await client
        .from('guilds')
        .select('*')
        .eq('id', membership.guild_id)
        .single();

      if (guildFetchError) {
        throw guildFetchError;
      }

      const { error: guildError } = await client
        .from('guilds')
        .update({
          shared_xp: guild.shared_xp + input.xp,
          total_xp: guild.total_xp + input.xp,
          total_distance: guild.total_distance + input.distanceKm
        })
        .eq('id', guild.id);

      if (guildError) {
        throw guildError;
      }
    })
  );
}

export function subscribeToGuilds(onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel('guild-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guilds' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_challenges' }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
