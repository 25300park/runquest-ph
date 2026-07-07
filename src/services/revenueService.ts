import { requireSupabaseClient } from '../lib/supabase';

export type RevenueMetrics = {
  mrrCents: number;
  totalSubscribers: number;
  activeSubscribers: number;
  churnRate: number;
  conversionRate: number;
  growthRate: number;
};

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const client = requireSupabaseClient();
  const [usersResult, revenueResult, subscriptionResult, passResult] = await Promise.allSettled([
    client.from('users').select('id,subscription_type,subscription_status,premium_expires_at'),
    client.from('revenue_events').select('*').order('occurred_at', { ascending: false }).limit(500),
    client.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(500),
    client.from('premium_passes').select('*').order('created_at', { ascending: false }).limit(500)
  ]);
  const users = usersResult.status === 'fulfilled' ? usersResult.value.data ?? [] : [];
  const revenue = revenueResult.status === 'fulfilled' ? revenueResult.value.data ?? [] : [];
  const subscriptions =
    subscriptionResult.status === 'fulfilled' ? subscriptionResult.value.data ?? [] : [];
  const passes = passResult.status === 'fulfilled' ? passResult.value.data ?? [] : [];
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
  const currentRevenue = currentMonth.reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  const previousRevenue = previousMonth.reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  const activeSubscribers = users.filter((user) => {
    const expiresAt = user.premium_expires_at ? new Date(user.premium_expires_at).getTime() : 0;
    return (
      user.subscription_type === 'premium' &&
      user.subscription_status === 'active' &&
      (!expiresAt || expiresAt > Date.now())
    );
  }).length;
  const totalSubscribers = new Set(passes.map((pass) => pass.user_id)).size;
  const canceled =
    passes.filter((pass) => pass.status === 'expired' || pass.status === 'canceled').length +
    subscriptions.filter((event) => event.status === 'canceled' || event.status === 'expired').length;

  return {
    mrrCents: currentRevenue,
    totalSubscribers,
    activeSubscribers,
    churnRate: totalSubscribers > 0 ? canceled / totalSubscribers : 0,
    conversionRate: users.length > 0 ? activeSubscribers / users.length : 0,
    growthRate: previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue : 0
  };
}

export function subscribeToRevenue(onChange: () => void) {
  const client = requireSupabaseClient();
  let debounceTimer: number | undefined;
  const debounced = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onChange, 500);
  };
  const channel = client
    .channel('revenue-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'revenue_events' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_events' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'premium_passes' }, debounced)
    .subscribe();

  return () => {
    window.clearTimeout(debounceTimer);
    client.removeChannel(channel);
  };
}
