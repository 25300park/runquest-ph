import { requireSupabaseClient } from '../lib/supabase';
import type {
  CharacterProfile,
  CharacterRunRewardInput,
  CharacterStatsRow,
  EquipmentItemRow
} from '../types/rpgCharacter';
import {
  calculateCharacterLevel,
  calculateCharacterXp,
  didLevelUp
} from '../utils/characterRpg';

const activeCharacterStorageKey = 'runquest-ph-active-character-id';

const starterEquipment: Array<Omit<EquipmentItemRow, 'id'>> = [
  {
    name: 'Starter Striders',
    type: 'shoes',
    rarity: 'common',
    speed_bonus: 0.02,
    xp_bonus: 0.02,
    image_url: '/images/equipment/starter-striders.svg'
  },
  {
    name: 'Quest Pack',
    type: 'backpack',
    rarity: 'common',
    speed_bonus: 0,
    xp_bonus: 0.03,
    image_url: '/images/equipment/quest-pack.svg'
  },
  {
    name: 'Sun Cap',
    type: 'hat',
    rarity: 'common',
    speed_bonus: 0,
    xp_bonus: 0.01,
    image_url: '/images/equipment/sun-cap.svg'
  },
  {
    name: 'Glow Charm',
    type: 'accessory',
    rarity: 'common',
    speed_bonus: 0,
    xp_bonus: 0.02,
    image_url: '/images/equipment/glow-charm.svg'
  }
];

function getStoredActiveCharacterId() {
  return typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(activeCharacterStorageKey);
}

export function setActiveCharacterId(characterId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(activeCharacterStorageKey, characterId);
  }
}

export async function ensureStarterEquipment() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('equipment_items').select('*');

  if (error) {
    throw error;
  }

  const existingNames = new Set((data ?? []).map((item) => item.name));
  const missingItems = starterEquipment.filter((item) => !existingNames.has(item.name));

  if (missingItems.length > 0) {
    const { error: insertError } = await client.from('equipment_items').insert(missingItems);

    if (insertError) {
      throw insertError;
    }
  }

  const { data: items, error: fetchError } = await client.from('equipment_items').select('*');

  if (fetchError) {
    throw fetchError;
  }

  return items ?? [];
}

export async function createCharacter(input: { name: string; avatarBaseUrl: string }) {
  const client = requireSupabaseClient();
  const { data: character, error } = await client
    .from('characters')
    .insert({
      name: input.name,
      avatar_base_url: input.avatarBaseUrl
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const { error: statsError } = await client.from('character_stats').insert({
    character_id: character.id
  });

  if (statsError) {
    throw statsError;
  }

  const items = await ensureStarterEquipment();
  const defaultItems = starterEquipment
    .map((starter) => items.find((item) => item.name === starter.name))
    .filter((item): item is EquipmentItemRow => Boolean(item));

  if (defaultItems.length > 0) {
    const { error: equipmentError } = await client.from('character_equipment').insert(
      defaultItems.map((item) => ({
        character_id: character.id,
        item_id: item.id,
        equipped: true
      }))
    );

    if (equipmentError) {
      throw equipmentError;
    }
  }

  setActiveCharacterId(character.id);
  return getCharacterProfile(character.id);
}

async function getCharacterStats(characterId: string): Promise<CharacterStatsRow | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('character_stats')
    .select('*')
    .eq('character_id', characterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCharacterProfile(characterId?: string): Promise<CharacterProfile | null> {
  const client = requireSupabaseClient();
  const targetCharacterId = characterId ?? getStoredActiveCharacterId();

  const characterQuery = client.from('characters').select('*').order('created_at', {
    ascending: false
  });
  const { data: character, error } = targetCharacterId
    ? await client.from('characters').select('*').eq('id', targetCharacterId).maybeSingle()
    : await characterQuery.limit(1).maybeSingle();

  if (error) {
    throw error;
  }

  if (!character) {
    return null;
  }

  setActiveCharacterId(character.id);
  const stats = await getCharacterStats(character.id);
  const { data: equipmentRows, error: equipmentError } = await client
    .from('character_equipment')
    .select('*')
    .eq('character_id', character.id);

  if (equipmentError) {
    throw equipmentError;
  }

  const items = await ensureStarterEquipment();
  const equipment = (equipmentRows ?? [])
    .map((equipmentRow) => {
      const item = items.find((candidate) => candidate.id === equipmentRow.item_id);
      return item ? { ...equipmentRow, item } : null;
    })
    .filter((item): item is CharacterProfile['equipment'][number] => Boolean(item));

  return {
    character,
    stats,
    equipment
  };
}

export async function equipItem(characterId: string, item: EquipmentItemRow) {
  const client = requireSupabaseClient();
  const profile = await getCharacterProfile(characterId);
  const sameSlotEquipmentIds =
    profile?.equipment
      .filter((equipment) => equipment.item.type === item.type)
      .map((equipment) => equipment.id) ?? [];

  if (sameSlotEquipmentIds.length > 0) {
    const { error: clearSlotError } = await client
      .from('character_equipment')
      .update({ equipped: false })
      .in('id', sameSlotEquipmentIds);

    if (clearSlotError) {
      throw clearSlotError;
    }
  }

  const { data: existing, error: existingError } = await client
    .from('character_equipment')
    .select('*')
    .eq('character_id', characterId)
    .eq('item_id', item.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error } = await client
      .from('character_equipment')
      .update({ equipped: true })
      .eq('id', existing.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await client.from('character_equipment').insert({
      character_id: characterId,
      item_id: item.id,
      equipped: true
    });

    if (error) {
      throw error;
    }
  }

  return getCharacterProfile(characterId);
}

export async function applyRunReward(input: CharacterRunRewardInput) {
  const profile = await getCharacterProfile();

  if (!profile) {
    return null;
  }

  const equippedItems = profile.equipment
    .filter((equipment) => equipment.equipped)
    .map((equipment) => equipment.item);
  const xpEarned = calculateCharacterXp(input, equippedItems);
  const previousXp = profile.character.xp;
  const nextXp = previousXp + xpEarned;
  const nextLevel = calculateCharacterLevel(nextXp);
  const leveledUp = didLevelUp(previousXp, nextXp);
  const client = requireSupabaseClient();

  const { error: characterError } = await client
    .from('characters')
    .update({
      xp: nextXp,
      level: nextLevel
    })
    .eq('id', profile.character.id);

  if (characterError) {
    throw characterError;
  }

  const stats = profile.stats;
  if (stats) {
    const { error: statsError } = await client
      .from('character_stats')
      .update({
        total_distance: stats.total_distance + input.distanceKm,
        total_runs: stats.total_runs + 1,
        total_xp: stats.total_xp + xpEarned,
        streak_days: Math.max(1, stats.streak_days + 1)
      })
      .eq('id', stats.id);

    if (statsError) {
      throw statsError;
    }
  }

  return {
    xpEarned,
    previousLevel: profile.character.level,
    nextLevel,
    leveledUp
  };
}

export function subscribeToCharacterUpdates(
  characterId: string,
  onChange: () => void
) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`character-engine-${characterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `id=eq.${characterId}`
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_stats',
        filter: `character_id=eq.${characterId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
