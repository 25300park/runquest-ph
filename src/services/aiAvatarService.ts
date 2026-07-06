import { requireSupabaseClient } from '../lib/supabase';
import type { CharacterProfile, EquipmentItemRow } from '../types/rpgCharacter';
import { buildAvatarPrompt } from '../utils/avatarEngine';

type GenerateAvatarInput = {
  characterId: string;
  characterBaseImage: string | null;
  equipmentItems: EquipmentItemRow[];
  level: number;
  xp: number;
  runningStatus?: string;
};

function deterministicAvatarUrl(input: GenerateAvatarInput) {
  const seed = encodeURIComponent(`${input.characterId}-${input.level}-${input.xp}`);
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
}

export async function generateAvatarImage(input: GenerateAvatarInput) {
  const apiUrl = import.meta.env.VITE_AI_AVATAR_API_URL as string | undefined;
  const prompt = [
    'consistent character identity, same face, same body structure, only outfit changes based on equipment, high consistency avatar',
    `character_id: ${input.characterId}`,
    `base_image: ${input.characterBaseImage ?? 'none'}`,
    `level: ${input.level}`,
    `xp: ${input.xp}`,
    `running_status: ${input.runningStatus ?? 'ready'}`,
    `equipment: ${input.equipmentItems.map((item) => item.name).join(', ') || 'none'}`
  ].join('\n');

  if (!apiUrl) {
    return {
      imageUrl: deterministicAvatarUrl(input),
      prompt,
      source: 'deterministic-fallback' as const
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      character_id: input.characterId,
      prompt,
      character_base_image: input.characterBaseImage,
      equipment_items: input.equipmentItems,
      level: input.level,
      xp: input.xp
    })
  });

  if (!response.ok) {
    throw new Error(`AI avatar generation failed: ${response.status}`);
  }

  const result = (await response.json()) as { imageUrl?: string; image_url?: string };

  return {
    imageUrl: result.imageUrl ?? result.image_url ?? deterministicAvatarUrl(input),
    prompt,
    source: 'api' as const
  };
}

export async function refreshCharacterAvatar(profile: CharacterProfile, runningStatus = 'ready') {
  const equippedItems = profile.equipment
    .filter((equipment) => equipment.equipped)
    .map((equipment) => equipment.item);
  const generated = await generateAvatarImage({
    characterId: profile.character.id,
    characterBaseImage: profile.character.avatar_base_url,
    equipmentItems: equippedItems,
    level: profile.character.level,
    xp: profile.character.xp,
    runningStatus
  });
  const client = requireSupabaseClient();
  const { error } = await client
    .from('characters')
    .update({ avatar_base_url: generated.imageUrl })
    .eq('id', profile.character.id);

  if (error) {
    throw error;
  }

  return {
    ...generated,
    identityPrompt: buildAvatarPrompt(profile, runningStatus)
  };
}

export function subscribeToAvatarRealtime(characterId: string, onChange: () => void) {
  const client = requireSupabaseClient();
  const channel = client
    .channel(`avatar-realtime-${characterId}`)
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
        table: 'character_equipment',
        filter: `character_id=eq.${characterId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
