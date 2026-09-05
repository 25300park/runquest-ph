import { requireSupabaseClient } from '../lib/supabase';
import type { EquipmentItemRow } from '../types/rpgCharacter';

const rarityDropWeights = {
  common: 0.7,
  rare: 0.9,
  epic: 0.98,
  legendary: 1
};

export async function getEquipmentCatalog() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('equipment_items').select('*').order('rarity');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getVirtualItemCatalog() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('items').select('*').order('rarity');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function rollItemRarity(seedValue: number) {
  if (seedValue <= rarityDropWeights.common) return 'common';
  if (seedValue <= rarityDropWeights.rare) return 'rare';
  if (seedValue <= rarityDropWeights.epic) return 'epic';
  return 'legendary';
}

export async function grantItemOwnership(input: {
  characterId: string;
  item: EquipmentItemRow;
  userId?: string | null;
  source?: string;
}) {
  const client = requireSupabaseClient();
  const { data: ownership, error } = await client
    .from('item_ownership')
    .insert({
      character_id: input.characterId,
      user_id: input.userId ?? null,
      item_id: input.item.id,
      serial_number: Date.now()
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const rarityRoll = Math.random();
  const { error: dropError } = await client.from('item_drops').insert({
    character_id: input.characterId,
    item_id: input.item.id,
    source: input.source ?? 'run_reward',
    rarity_roll: rarityRoll
  });

  if (dropError) {
    throw dropError;
  }

  return ownership;
}

export async function maybeDropEquipment(characterId: string) {
  const catalog = await getEquipmentCatalog();
  const rarity = rollItemRarity(Math.random());
  const candidates = catalog.filter((item) => item.rarity === rarity);
  const item = candidates[0] ?? catalog[0];

  if (!item) {
    return null;
  }

  return grantItemOwnership({
    characterId,
    item
  });
}

export async function upgradeOwnedItem(ownershipId: string) {
  const client = requireSupabaseClient();
  const { data: ownership, error: fetchError } = await client
    .from('item_ownership')
    .select('*')
    .eq('id', ownershipId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const { data, error } = await client
    .from('item_ownership')
    .update({ upgrade_level: ownership.upgrade_level + 1 })
    .eq('id', ownershipId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function subscribeToEquipmentEconomy(characterId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`equipment-economy-${characterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'item_ownership',
        filter: `character_id=eq.${characterId}`
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_equipment',
        filter: `character_id=eq.${characterId}`
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_items',
        filter: `character_id=eq.${characterId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export interface EquipmentDurability {
  id: string;
  name: string;
  slot: 'shoes' | 'backpack' | 'cap' | 'charm';
  icon: string;
  durability: number; // 0 ~ 100
  repairCostGold: number;
  buff: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

const DURABILITY_STORAGE_KEY = 'rq_gear_durability_v1';

export const defaultGearList: EquipmentDurability[] = [
  {
    id: 'gear-shoes-1',
    name: 'Starter Striders',
    slot: 'shoes',
    icon: '👟',
    durability: 85,
    repairCostGold: 50,
    buff: '+5% Running XP',
    rarity: 'Common'
  },
  {
    id: 'gear-pack-1',
    name: 'Quest Hydration Pack',
    slot: 'backpack',
    icon: '🎒',
    durability: 92,
    repairCostGold: 60,
    buff: '+10% Stamina Save',
    rarity: 'Rare'
  },
  {
    id: 'gear-cap-1',
    name: 'Sun Runner Visor',
    slot: 'cap',
    icon: '🧢',
    durability: 74,
    repairCostGold: 45,
    buff: '+5% Heat Resist',
    rarity: 'Common'
  },
  {
    id: 'gear-charm-1',
    name: 'BGC Neon Charm',
    slot: 'charm',
    icon: '✨',
    durability: 100,
    repairCostGold: 120,
    buff: '+15% Territory Gold',
    rarity: 'Epic'
  }
];

export function getSavedGearDurability(): EquipmentDurability[] {
  if (typeof window === 'undefined') return defaultGearList;
  try {
    const saved = localStorage.getItem(DURABILITY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultGearList;
  } catch {
    return defaultGearList;
  }
}

export function saveGearDurability(list: EquipmentDurability[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DURABILITY_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function repairEquipmentItem(gearId: string): { success: boolean; updatedList: EquipmentDurability[] } {
  const list = getSavedGearDurability();
  const updated = list.map((gear) => {
    if (gear.id === gearId) {
      return { ...gear, durability: 100 };
    }
    return gear;
  });
  saveGearDurability(updated);
  return { success: true, updatedList: updated };
}

export function degradeEquipmentOnRun(distanceKm: number): EquipmentDurability[] {
  const wear = Math.max(1, Math.round(distanceKm * 1.2));
  const list = getSavedGearDurability();
  const updated = list.map((gear) => ({
    ...gear,
    durability: Math.max(0, gear.durability - wear)
  }));
  saveGearDurability(updated);
  return updated;
}
