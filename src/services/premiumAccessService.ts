import { requireSupabaseClient } from '../lib/supabase';

export type PremiumAccess = {
  active: boolean;
  plan: 'free' | 'premium_30_day';
  endDate: string | null;
  provider: string | null;
};

export async function getPremiumAccess(userId: string | null): Promise<PremiumAccess> {
  if (!userId) {
    return { active: false, plan: 'free', endDate: null, provider: null };
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('premium_passes')
    .select('end_date,payment_provider')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { active: false, plan: 'free', endDate: null, provider: null };
  }

  return {
    active: true,
    plan: 'premium_30_day',
    endDate: data.end_date,
    provider: data.payment_provider
  };
}

export function premiumFeatureFlags(access: PremiumAccess) {
  return {
    advancedAiCoach: access.active,
    xpMultiplierBoost: access.active,
    exclusiveCourses: access.active,
    guildBonuses: access.active
  };
}
