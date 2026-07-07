import { requireSupabaseClient } from '../lib/supabase';
import type { CharacterProfile } from '../types/rpgCharacter';
import { getPremiumAccess } from './premiumAccessService';

export type PersonalizationPlan = {
  difficulty: 'easy' | 'normal' | 'hard';
  motivation: string;
  weeklyFocus: string;
  premiumInsights: string[];
};

function hashInput(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export async function getPersonalizedPlan(profile: CharacterProfile | null): Promise<PersonalizationPlan> {
  const client = requireSupabaseClient();
  const userId = profile?.character.user_id ?? null;
  const characterId = profile?.character.id ?? null;
  const access = await getPremiumAccess(userId);
  const subscriptionPlan = access.plan;
  const input = JSON.stringify({
    level: profile?.character.level ?? 1,
    xp: profile?.character.xp ?? 0,
    runs: profile?.stats?.total_runs ?? 0,
    distance: profile?.stats?.total_distance ?? 0,
    streak: profile?.stats?.streak_days ?? 0,
    subscriptionPlan
  });
  const inputHash = hashInput(input);

  if (userId) {
    const { data: cached } = await client
      .from('ai_personalization_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('input_hash', inputHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached?.plan) {
      return cached.plan as PersonalizationPlan;
    }
  }

  const streak = profile?.stats?.streak_days ?? 0;
  const distance = profile?.stats?.total_distance ?? 0;
  const isPremium = access.active;
  const plan: PersonalizationPlan = {
    difficulty: streak >= 5 || distance >= 30 ? 'hard' : distance >= 10 ? 'normal' : 'easy',
    motivation:
      streak >= 3
        ? 'Your consistency is becoming a real advantage. Keep the next run controlled.'
        : 'Build rhythm first. One comfortable run is enough to move the story forward.',
    weeklyFocus: isPremium
      ? 'Premium plan: add one progression run, one recovery walk, and one longer city route.'
      : 'Free plan: complete two easy routes and protect recovery.',
    premiumInsights: isPremium
      ? ['Adaptive difficulty enabled', 'Advanced weekly progression enabled']
      : ['Upgrade to unlock adaptive pace and deeper weekly planning']
  };

  if (userId) {
    await client.from('ai_personalization_cache').insert({
      user_id: userId,
      character_id: characterId,
      subscription_plan: subscriptionPlan,
      input_hash: inputHash,
      plan
    });
  }

  return plan;
}
