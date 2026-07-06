import { requireSupabaseClient } from '../lib/supabase';
import { createCharacter, getCharacterProfile } from './characterService';
import type { Database } from '../types/database';

export type LiveUserProfile = Database['public']['Tables']['users']['Row'];

const defaultAvatarUrl = '/images/characters/explorer.svg';

export async function ensureUserProfile(input?: {
  name?: string | null;
}): Promise<LiveUserProfile> {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError) throw authError;
  const authUser = authData.user;
  if (!authUser?.email) {
    throw new Error('Login required before creating a RunQuest profile.');
  }

  const displayName =
    input?.name ||
    authUser.user_metadata?.name ||
    authUser.email.split('@')[0] ||
    'RunQuest Runner';

  const { data: existing, error: existingError } = await client
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data: created, error: createError } = await client
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: displayName,
      role: 'user',
      status: 'active',
      subscription_type: 'free'
    })
    .select('*')
    .single();

  if (createError) throw createError;
  return created;
}

export async function ensureDefaultCharacter(profile: LiveUserProfile) {
  const existingCharacter = await getCharacterProfile();
  if (existingCharacter) return existingCharacter;

  return createCharacter({
    userId: profile.id,
    name: profile.name ? `${profile.name} Explorer` : 'RunQuest Explorer',
    avatarBaseUrl: defaultAvatarUrl
  });
}

export async function signInRunQuest(email: string, password: string) {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await ensureUserProfile();
  const character = await ensureDefaultCharacter(profile);
  return { profile, character };
}

export async function registerRunQuest(input: {
  email: string;
  password: string;
  name: string;
}) {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name
      }
    }
  });

  if (error) throw error;

  const profile = await ensureUserProfile({ name: input.name });
  const character = await ensureDefaultCharacter(profile);
  return { profile, character };
}
