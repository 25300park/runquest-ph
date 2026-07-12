import { requireSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type RevenueRow = Database['public']['Tables']['revenue_events']['Row'];
type PassRow = Database['public']['Tables']['premium_passes']['Row'];
type FraudRow = Database['public']['Tables']['payment_fraud_logs']['Row'];
type EnterpriseAccount = Database['public']['Tables']['enterprise_accounts']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type RevenueOptimization = Database['public']['Tables']['ai_revenue_optimizations']['Row'];

export type InvestorMetrics = {
  mrrCents: number;
  arrCents: number;
  cacCents: number;
  ltvCents: number;
  churnRate: number;
  activeUsers: number;
  growthRate: number;
  activePremiumUsers: number;
  enterpriseAccounts: number;
  highRiskPayments: number;
  monthlyTrend: Array<{ label: string; revenueCents: number }>;
};

function monthKey(date: string) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function hashInput(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export async function getInvestorMetrics(): Promise<InvestorMetrics> {
  const client = requireSupabaseClient();
  const [usersResult, revenueResult, passesResult, fraudResult, enterpriseResult] = await Promise.allSettled([
    client.from('users').select('*'),
    client.from('revenue_events').select('*').order('occurred_at', { ascending: false }).limit(1000),
    client.from('premium_passes').select('*').order('created_at', { ascending: false }).limit(1000),
    client.from('payment_fraud_logs').select('*').order('created_at', { ascending: false }).limit(500),
    client.from('enterprise_accounts').select('*').order('created_at', { ascending: false }).limit(500)
  ]);
  const users = usersResult.status === 'fulfilled' ? (usersResult.value.data ?? []) as UserRow[] : [];
  const revenue = revenueResult.status === 'fulfilled' ? (revenueResult.value.data ?? []) as RevenueRow[] : [];
  const passes = passesResult.status === 'fulfilled' ? (passesResult.value.data ?? []) as PassRow[] : [];
  const fraudLogs = fraudResult.status === 'fulfilled' ? (fraudResult.value.data ?? []) as FraudRow[] : [];
  const enterprise =
    enterpriseResult.status === 'fulfilled' ? (enterpriseResult.value.data ?? []) as EnterpriseAccount[] : [];
  const now = new Date();
  const currentMonth = revenue.filter((event) => {
    const date = new Date(event.occurred_at);
    return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
  });
  const previousMonth = revenue.filter((event) => {
    const date = new Date(event.occurred_at);
    const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return date.getUTCFullYear() === previous.getUTCFullYear() && date.getUTCMonth() === previous.getUTCMonth();
  });
  const mrrCents = currentMonth.reduce((sum, event) => sum + event.amount_cents, 0);
  const previousMrr = previousMonth.reduce((sum, event) => sum + event.amount_cents, 0);
  const activePremiumUsers = users.filter((user) => {
    const expiry = user.premium_expires_at ? new Date(user.premium_expires_at).getTime() : 0;
    return user.subscription_type === 'premium' && user.subscription_status === 'active' && expiry > Date.now();
  }).length;
  const expiredOrCanceled = passes.filter((pass) => pass.status !== 'active').length;
  const totalRevenue = revenue.reduce((sum, event) => sum + event.amount_cents, 0);
  const payingUsers = new Set(revenue.map((event) => event.user_id).filter(Boolean)).size;
  const grouped = revenue.reduce<Record<string, number>>((acc, event) => {
    const key = monthKey(event.occurred_at);
    acc[key] = (acc[key] ?? 0) + event.amount_cents;
    return acc;
  }, {});
  const monthlyTrend = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, revenueCents]) => ({ label, revenueCents }));

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    cacCents: 0,
    ltvCents: payingUsers > 0 ? Math.round(totalRevenue / payingUsers) : 0,
    churnRate: passes.length > 0 ? expiredOrCanceled / passes.length : 0,
    activeUsers: users.filter((user) => user.status === 'active').length,
    growthRate: previousMrr > 0 ? (mrrCents - previousMrr) / previousMrr : 0,
    activePremiumUsers,
    enterpriseAccounts: enterprise.filter((account) => account.status === 'active').length,
    highRiskPayments: fraudLogs.filter((log) => log.risk_level === 'high').length,
    monthlyTrend
  };
}

export async function getFinancialRiskLogs() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('payment_fraud_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [] as FraudRow[];
  return (data ?? []) as FraudRow[];
}

export async function getEnterpriseBillingSummary() {
  const client = requireSupabaseClient();
  const [accountsResult, invoicesResult] = await Promise.allSettled([
    client.from('enterprise_accounts').select('*').order('created_at', { ascending: false }).limit(50),
    client.from('invoices').select('*').order('created_at', { ascending: false }).limit(50)
  ]);

  return {
    accounts:
      accountsResult.status === 'fulfilled' ? ((accountsResult.value.data ?? []) as EnterpriseAccount[]) : [],
    invoices: invoicesResult.status === 'fulfilled' ? ((invoicesResult.value.data ?? []) as Invoice[]) : []
  };
}

export async function getRevenueOptimization(): Promise<RevenueOptimization | null> {
  const client = requireSupabaseClient();
  const metrics = await getInvestorMetrics();
  const inputHash = hashInput(JSON.stringify(metrics));
  const { data: cached } = await client
    .from('ai_revenue_optimizations')
    .select('*')
    .eq('segment', 'all_users')
    .eq('input_hash', inputHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) return cached as RevenueOptimization;

  const churnProbability = Math.min(1, metrics.churnRate + (metrics.growthRate < 0 ? 0.15 : 0));
  const conversionRate = metrics.activeUsers > 0 ? metrics.activePremiumUsers / metrics.activeUsers : 0;
  const engagementLevel: 'low' | 'medium' | 'high' =
    conversionRate > 0.12 ? 'high' : conversionRate > 0.04 ? 'medium' : 'low';
  const optimization = {
    segment: 'all_users',
    input_hash: inputHash,
    churn_probability: churnProbability,
    conversion_rate: conversionRate,
    engagement_level: engagementLevel,
    pricing_suggestion: {
      premium_pass_php: metrics.growthRate < -0.1 ? 129 : 149,
      enterprise_seat_php: 99
    },
    discount_triggers: [
      churnProbability > 0.25 ? 'Offer 7-day comeback discount after pass expiry' : 'No broad discount needed'
    ],
    upgrade_prompts: [
      conversionRate < 0.05 ? 'Show AI coach preview after quest completion' : 'Prioritize guild bonus messaging'
    ],
    retention_strategy:
      churnProbability > 0.25
        ? 'Focus on renewal reminders three days before pass expiry.'
        : 'Keep premium messaging tied to AI coach and guild progress.'
  };
  const { data } = await client.from('ai_revenue_optimizations').insert(optimization).select('*').single();
  return (data ?? optimization) as RevenueOptimization;
}

export async function logSubscriptionChange(input: {
  userId: string;
  fromPlan: string;
  toPlan: string;
  changeType: 'upgrade' | 'downgrade' | 'renewal' | 'enterprise_upgrade';
}) {
  const client = requireSupabaseClient();
  await client.from('subscription_changes').insert({
    user_id: input.userId,
    from_plan: input.fromPlan,
    to_plan: input.toPlan,
    change_type: input.changeType
  });
}
