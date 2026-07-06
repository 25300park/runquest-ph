import type { CharacterProfile, EquipmentItemRow } from '../types/rpgCharacter';

export const avatarBaseOptions = [
  {
    id: 'trail-scout',
    name: 'Trail Scout',
    avatarUrl: '/images/characters/trail-scout.svg',
    color: 'from-teal-400 to-emerald-700'
  },
  {
    id: 'city-runner',
    name: 'City Runner',
    avatarUrl: '/images/characters/city-runner.svg',
    color: 'from-amber-300 to-orange-700'
  },
  {
    id: 'bay-guardian',
    name: 'Bay Guardian',
    avatarUrl: '/images/characters/bay-guardian.svg',
    color: 'from-sky-300 to-indigo-700'
  },
  {
    id: 'night-chaser',
    name: 'Night Chaser',
    avatarUrl: '/images/characters/night-chaser.svg',
    color: 'from-fuchsia-300 to-slate-800'
  }
];

export function buildAvatarPrompt(profile: CharacterProfile, runningStatus = 'ready') {
  const equippedItems = profile.equipment
    .filter((equipment) => equipment.equipped)
    .map((equipment) => equipment.item.name)
    .join(', ');

  return [
    'consistent character identity, same face, same body proportions, only outfit changes',
    `character name: ${profile.character.name}`,
    `base image: ${profile.character.avatar_base_url ?? 'selected RunQuest base avatar'}`,
    `equipped items: ${equippedItems || 'starter outfit'}`,
    `running status: ${runningStatus}`,
    'style: mobile RPG running adventure avatar, bright Philippine city exploration mood'
  ].join('\n');
}

export function describeOutfitLayer(item: EquipmentItemRow) {
  const layerByType = {
    shoes: 'bottom footwear',
    backpack: 'back item',
    hat: 'head item',
    accessory: 'body effects'
  };

  return `${item.name} modifies ${layerByType[item.type]}`;
}
