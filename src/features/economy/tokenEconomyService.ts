import { requireSupabaseClient } from '../../lib/supabase';
import type { Json } from '../../types/database';

export type TokenRewardInput = {
  distanceKm: number;
  streakBonus?: number;
  difficultyMultiplier?: number;
  tokenRate?: number;
  rewardCurve?: number;
  cheatPenalty?: number;
};

export function calculateRunTokens(input: TokenRewardInput) {
  const tokenRate = input.tokenRate ?? 10;
  const rewardCurve = input.rewardCurve ?? 1;
  const baseTokens = input.distanceKm * tokenRate * rewardCurve;
  const streakBonus = input.streakBonus ?? 0;
  const difficultyBonus = input.difficultyMultiplier ?? 1;
  const cheatPenalty = input.cheatPenalty ?? 0;

  return Math.max(0, Math.round(baseTokens + streakBonus + difficultyBonus - cheatPenalty));
}

export async function getOrCreateTokenWallet(input: {
  userId?: string | null;
  characterId?: string | null;
}) {
  const client = requireSupabaseClient();
  let query = client.from('run_token_wallets').select('*');

  if (input.characterId) {
    query = query.eq('character_id', input.characterId);
  } else if (input.userId) {
    query = query.eq('user_id', input.userId);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await client
    .from('run_token_wallets')
    .insert({
      user_id: input.userId ?? null,
      character_id: input.characterId ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function awardRunTokens(input: {
  userId?: string | null;
  characterId?: string | null;
  reward: TokenRewardInput;
  reason?: string;
  metadata?: Json;
}) {
  const client = requireSupabaseClient();
  const wallet = await getOrCreateTokenWallet({
    userId: input.userId,
    characterId: input.characterId
  });
  const amount = calculateRunTokens(input.reward);

  const { data: updatedWallet, error: walletError } = await client
    .from('run_token_wallets')
    .update({
      balance: wallet.balance + amount,
      lifetime_earned: wallet.lifetime_earned + amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select('*')
    .single();

  if (walletError) throw walletError;

  const { data: transaction, error: transactionError } = await client
    .from('run_token_transactions')
    .insert({
      wallet_id: wallet.id,
      amount,
      reason: input.reason ?? 'run_reward',
      metadata: input.metadata ?? {}
    })
    .select('*')
    .single();

  if (transactionError) throw transactionError;

  return {
    amount,
    wallet: updatedWallet,
    transaction
  };
}

export async function spendRunTokens(input: {
  userId?: string | null;
  characterId?: string | null;
  amount: number;
  reason: 'equipment_purchase' | 'avatar_skin' | 'guild_war_entry';
  metadata?: Json;
}) {
  const client = requireSupabaseClient();
  const wallet = await getOrCreateTokenWallet({
    userId: input.userId,
    characterId: input.characterId
  });

  if (wallet.balance < input.amount) {
    throw new Error('Not enough RunTokens.');
  }

  const { data: updatedWallet, error: walletError } = await client
    .from('run_token_wallets')
    .update({
      balance: wallet.balance - input.amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select('*')
    .single();

  if (walletError) throw walletError;

  const { data: transaction, error: transactionError } = await client
    .from('run_token_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: -input.amount,
      reason: input.reason,
      metadata: input.metadata ?? {}
    })
    .select('*')
    .single();

  if (transactionError) throw transactionError;

  return {
    wallet: updatedWallet,
    transaction
  };
}

export function subscribeToTokenWallet(characterId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`run-token-wallet-${characterId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'run_token_wallets',
      filter: `character_id=eq.${characterId}`
    }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
