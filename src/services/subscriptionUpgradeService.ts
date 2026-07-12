import { requireSupabaseClient } from '../lib/supabase';
import { getPremiumAccess } from './premiumAccessService';
import { logSubscriptionChange } from './financialOpsService';

export async function recordPremiumUpgrade(userId: string) {
  const access = await getPremiumAccess(userId);
  await logSubscriptionChange({
    userId,
    fromPlan: access.active ? access.plan : 'free',
    toPlan: 'premium_30_day',
    changeType: access.active ? 'renewal' : 'upgrade'
  });
}

export async function recordEnterpriseUpgrade(userId: string, enterpriseAccountId: string) {
  const client = requireSupabaseClient();
  await client.from('enterprise_users').upsert({
    enterprise_account_id: enterpriseAccountId,
    user_id: userId,
    role: 'member',
    status: 'active'
  });
  await logSubscriptionChange({
    userId,
    fromPlan: 'premium_30_day',
    toPlan: 'enterprise',
    changeType: 'enterprise_upgrade'
  });
}

export async function recordDowngrade(userId: string) {
  await logSubscriptionChange({
    userId,
    fromPlan: 'premium_30_day',
    toPlan: 'free',
    changeType: 'downgrade'
  });
}
