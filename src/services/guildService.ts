import { requireSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/database';

export type GuildRow = Database['public']['Tables']['guilds']['Row'];
export type GuildMemberRow = Database['public']['Tables']['guild_members']['Row'];

const defaultMaxGuildMembers = Number(import.meta.env.VITE_MAX_GUILD_MEMBERS ?? 50);

export async function listGuilds() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guilds')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function listGuildMembers(guildId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('guild_members')
    .select('*')
    .eq('guild_id', guildId);

  if (error) throw error;
  return data ?? [];
}

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
  const members = await listGuildMembers(input.guildId);
  const maxMembers = Number.isFinite(defaultMaxGuildMembers) ? defaultMaxGuildMembers : 50;

  if (members.length >= maxMembers) {
    throw new Error('This guild is full.');
  }

  const alreadyJoined = members.find(
    (member) =>
      (input.userId && member.user_id === input.userId) ||
      (input.characterId && member.character_id === input.characterId)
  );

  if (alreadyJoined) {
    return alreadyJoined;
  }

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
    .order('total_xp', { ascending: false })
    .limit(100);

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

      const rankScore = guild.total_xp + input.xp * 2 + guild.total_distance + input.distanceKm;
      const { data: score } = await client
        .from('guild_scores')
        .select('*')
        .eq('guild_id', guild.id)
        .maybeSingle();

      if (score) {
        const { error: scoreError } = await client
          .from('guild_scores')
          .update({
            total_xp: score.total_xp + input.xp,
            total_distance: score.total_distance + input.distanceKm,
            rank_score: score.rank_score + input.xp * 2 + input.distanceKm,
            updated_at: new Date().toISOString()
          })
          .eq('id', score.id);

        if (scoreError) throw scoreError;
      } else {
        const { error: scoreError } = await client.from('guild_scores').insert({
          guild_id: guild.id,
          total_xp: input.xp,
          total_distance: input.distanceKm,
          rank_score: rankScore
        });

        if (scoreError) throw scoreError;
      }
    })
  );
}

export function subscribeToGuilds(onChange: () => void) {
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
    .channel('guild-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guilds' }, debouncedChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_members' }, debouncedChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_challenges' }, debouncedChange)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Guild realtime unavailable:', status);
      }
    });

  return () => {
    if (typeof window !== 'undefined') {
      window.clearTimeout(debounceTimer);
    }
    client.removeChannel(channel);
  };
}
