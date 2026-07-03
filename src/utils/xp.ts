import type { Difficulty } from '../types/course';

export const difficultyMultipliers: Record<Difficulty, number> = {
  Easy: 1,
  Normal: 1.2,
  Hard: 1.5,
  Challenge: 2
};

export const levelThresholds = [0, 300, 700, 1200, 2000, 3200, 4800, 6800, 9200, 12000];

export function calculateBaseXp(distanceKm: number, difficulty: Difficulty) {
  return Math.round(distanceKm * 100 * difficultyMultipliers[difficulty]);
}

export function calculateLevelFromXp(totalXp: number) {
  let level = 1;

  levelThresholds.forEach((threshold, index) => {
    if (totalXp >= threshold) {
      level = index + 1;
    }
  });

  return level;
}

export function getNextLevelXp(totalXp: number) {
  const currentLevel = calculateLevelFromXp(totalXp);

  return levelThresholds[currentLevel] ?? levelThresholds[levelThresholds.length - 1];
}

export function getCurrentLevelBaseXp(totalXp: number) {
  const currentLevel = calculateLevelFromXp(totalXp);

  return levelThresholds[currentLevel - 1] ?? 0;
}
