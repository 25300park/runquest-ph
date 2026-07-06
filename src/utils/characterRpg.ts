import type { CharacterRunRewardInput, EquipmentItemRow } from '../types/rpgCharacter';

export const xpPerLevel = 100;

export const difficultyXpValues: Record<string, number> = {
  Easy: 1,
  Normal: 2,
  Hard: 3,
  Challenge: 4
};

export function calculateCharacterXp(input: CharacterRunRewardInput, equipment: EquipmentItemRow[]) {
  const equipmentBonus = equipment.reduce((bonus, item) => bonus + item.xp_bonus, 0);
  const baseXp =
    input.distanceKm * 10 + input.difficultyMultiplier * 20 + input.loopMultiplier * 15;

  return Math.round(baseXp * (1 + equipmentBonus));
}

export function calculateCharacterLevel(xp: number) {
  return Math.floor(xp / xpPerLevel) + 1;
}

export function didLevelUp(previousXp: number, nextXp: number) {
  return calculateCharacterLevel(nextXp) > calculateCharacterLevel(previousXp);
}

export function getLevelProgress(xp: number) {
  return xp % xpPerLevel;
}
