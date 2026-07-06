import type { Database } from './database';

export type CharacterRow = Database['public']['Tables']['characters']['Row'];
export type CharacterStatsRow = Database['public']['Tables']['character_stats']['Row'];
export type EquipmentItemRow = Database['public']['Tables']['equipment_items']['Row'];
export type CharacterEquipmentRow = Database['public']['Tables']['character_equipment']['Row'];
export type EquipmentType = EquipmentItemRow['type'];

export type CharacterProfile = {
  character: CharacterRow;
  stats: CharacterStatsRow | null;
  equipment: Array<CharacterEquipmentRow & { item: EquipmentItemRow }>;
};

export type CharacterRunRewardInput = {
  distanceKm: number;
  difficultyMultiplier: number;
  loopMultiplier: number;
};
