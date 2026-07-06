import { requireSupabaseClient } from '../../lib/supabase';
import type { Database } from '../../types/database';

export type MarketplaceItem = Database['public']['Tables']['marketplace_items']['Row'];
export type MarketplaceTransaction = Database['public']['Tables']['transactions']['Row'];

export async function listMarketplaceItem(input: {
  itemId: string;
  sellerId?: string | null;
  price: number;
  rarity: string;
}) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('marketplace_items')
    .insert({
      item_id: input.itemId,
      seller_id: input.sellerId ?? null,
      price: input.price,
      rarity: input.rarity,
      status: 'listed'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMarketplaceListings() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('marketplace_items')
    .select('*')
    .eq('status', 'listed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function buyMarketplaceItem(input: {
  listingId: string;
  buyerId?: string | null;
}) {
  const client = requireSupabaseClient();
  const { data: listing, error: listingError } = await client
    .from('marketplace_items')
    .select('*')
    .eq('id', input.listingId)
    .single();

  if (listingError) throw listingError;
  if (listing.status !== 'listed') {
    throw new Error('Marketplace item is not available.');
  }

  const { data: transaction, error: transactionError } = await client
    .from('transactions')
    .insert({
      buyer_id: input.buyerId ?? null,
      seller_id: listing.seller_id,
      item_id: listing.item_id,
      price: listing.price
    })
    .select('*')
    .single();

  if (transactionError) throw transactionError;

  const { error: updateError } = await client
    .from('marketplace_items')
    .update({ status: 'sold' })
    .eq('id', listing.id);

  if (updateError) throw updateError;
  return transaction;
}

export async function cancelMarketplaceListing(listingId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('marketplace_items')
    .update({ status: 'cancelled' })
    .eq('id', listingId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMarketplace(onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel('marketplace-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
