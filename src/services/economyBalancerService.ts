import { requireSupabaseClient } from '../lib/supabase';

export type EconomyBalanceResult = {
  xpMultiplier: number;
  tokenRate: number;
  rewardCurve: number;
  difficultyBalance: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function calculateEconomyBalance(): Promise<EconomyBalanceResult> {
  const client = requireSupabaseClient();
  const [activityResult, walletResult] = await Promise.allSettled([
    client.from('activities').select('xp_earned,distance').limit(500),
    client.from('run_token_wallets').select('balance,lifetime_earned').limit(500)
  ]);
  const activities =
    activityResult.status === 'fulfilled' ? activityResult.value.data ?? [] : [];
  const wallets = walletResult.status === 'fulfilled' ? walletResult.value.data ?? [] : [];
  const totalXp = activities.reduce((sum, row) => sum + (row.xp_earned ?? 0), 0);
  const totalDistance = activities.reduce((sum, row) => sum + (row.distance ?? 0), 0);
  const totalTokens = wallets.reduce((sum, row) => sum + (row.lifetime_earned ?? 0), 0);
  const xpPerKm = totalDistance > 0 ? totalXp / totalDistance : 100;
  const tokenInflation = wallets.length > 0 ? totalTokens / wallets.length : 0;

  return {
    xpMultiplier: clamp(100 / Math.max(50, xpPerKm), 0.75, 1.25),
    tokenRate: clamp(tokenInflation > 500 ? 8 : 10, 6, 12),
    rewardCurve: clamp(totalDistance > 1000 ? 0.95 : 1, 0.85, 1.15),
    difficultyBalance: clamp(xpPerKm > 140 ? 1.1 : 1, 0.9, 1.2)
  };
}

export async function applyEconomyBalance() {
  const client = requireSupabaseClient();
  const balance = await calculateEconomyBalance();
  const settings = [
    ['xp_multiplier', balance.xpMultiplier, 'Auto-balanced XP multiplier'],
    ['token_rate', balance.tokenRate, 'Auto-balanced RunToken rate'],
    ['reward_curve', balance.rewardCurve, 'Auto-balanced reward curve'],
    ['difficulty_balance', balance.difficultyBalance, 'Auto-balanced difficulty factor']
  ] as const;

  await Promise.all(
    settings.map(([setting_key, setting_value, description]) =>
      client.from('system_settings').upsert({
        setting_key,
        setting_value,
        description,
        updated_at: new Date().toISOString()
      })
    )
  );

  return balance;
}
