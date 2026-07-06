import { requireSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/database';

export type ReferralRow = Database['public']['Tables']['referrals']['Row'];

function buildReferralCode(seed: string) {
  return `RQ-${seed.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function ensureReferralCode(userId: string, email?: string | null) {
  const client = requireSupabaseClient();
  const { data: user, error } = await client
    .from('users')
    .select('id,email,referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (user?.referral_code) return user.referral_code;

  const referralCode = buildReferralCode(email ?? userId);
  const { data, error: updateError } = await client
    .from('users')
    .update({ referral_code: referralCode })
    .eq('id', userId)
    .select('referral_code')
    .single();

  if (updateError) throw updateError;
  return data.referral_code;
}

export async function applyReferral(input: {
  referredUserId: string;
  referralCode?: string | null;
}) {
  if (!input.referralCode) return null;

  const client = requireSupabaseClient();
  const { data: referrer, error: referrerError } = await client
    .from('users')
    .select('id,xp,referral_code')
    .eq('referral_code', input.referralCode)
    .maybeSingle();

  if (referrerError) throw referrerError;
  if (!referrer || referrer.id === input.referredUserId) {
    return null;
  }

  const rewardXp = 100;
  const { data: referral, error } = await client
    .from('referrals')
    .insert({
      referrer_user_id: referrer.id,
      referred_user_id: input.referredUserId,
      referral_code: input.referralCode,
      reward_xp: rewardXp,
      status: 'rewarded'
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }

  await client
    .from('users')
    .update({ xp: (referrer.xp ?? 0) + rewardXp })
    .eq('id', referrer.id);

  await client.from('users').update({ referred_by: referrer.id }).eq('id', input.referredUserId);
  return referral;
}

export async function listReferralsForUser(userId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('referrals')
    .select('*')
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
