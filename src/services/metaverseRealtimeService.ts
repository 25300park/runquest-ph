import { requireSupabaseClient } from '../lib/supabase';

const realtimeTables = [
  'race_sessions',
  'race_participants',
  'leaderboard',
  'guild_wars',
  'seasonal_guilds',
  'map_zones',
  'zone_activity',
  'marketplace_items',
  'transactions'
];

export function subscribeToMetaverseRealtime(onChange: (table: string) => void) {
  const client = requireSupabaseClient();
  const channel = realtimeTables.reduce((currentChannel, table) => {
    return currentChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table
      },
      () => onChange(table)
    );
  }, client.channel('runquest-metaverse-realtime'));

  channel.subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
