import { requireSupabaseClient } from '../lib/supabase';
import type { Json } from '../types/database';

export async function queueMarketingCampaign(input: {
  userId?: string | null;
  campaignType: 'inactivity' | 'milestone' | 'leaderboard' | 'weekly_summary';
  channel?: 'push' | 'email';
  payload?: Json;
}) {
  if (!input.userId) return null;
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('marketing_campaigns')
    .insert({
      user_id: input.userId,
      campaign_type: input.campaignType,
      channel: input.channel ?? 'push',
      payload: input.payload ?? {},
      status: 'queued'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
