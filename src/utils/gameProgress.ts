import { mockAreas } from '../data/mockAreas';
import { mockCharacters } from '../data/mockCharacters';
import { mockUser } from '../data/mockUser';
import type { CompletedActivitySummary } from '../types/activity';
import type { Course } from '../types/course';
import { calculateLevelFromXp, difficultyMultipliers } from './xp';

const progressStorageKey = 'runquest-ph-progress';
const selectedCharacterStorageKey = 'runquest-ph-selected-character';

type CharacterProgress = {
  totalXp: number;
  level: number;
};

export type RewardBreakdown = {
  baseXp: number;
  difficultyBonusXp: number;
  consistencyBonusXp: number;
  totalXp: number;
};

export type GameProgress = {
  totalXp: number;
  totalDistanceKm: number;
  completedActivities: number;
  selectedCharacterId: string;
  characterProgress: Record<string, CharacterProgress>;
  areaProgress: Record<string, number>;
  processedActivityIds: string[];
};

export type ProgressUpdate = {
  progress: GameProgress;
  reward: RewardBreakdown;
  previousLevel: number;
  currentLevel: number;
  didLevelUp: boolean;
};

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createInitialProgress(): GameProgress {
  const selectedCharacterId = getSelectedCharacterId();
  const characterProgress = mockCharacters.reduce<Record<string, CharacterProgress>>(
    (result, character) => {
      const totalXp = character.id === selectedCharacterId ? mockUser.totalXp : 0;
      result[character.id] = {
        totalXp,
        level: calculateLevelFromXp(totalXp)
      };
      return result;
    },
    {}
  );
  const areaProgress = mockAreas.reduce<Record<string, number>>((result, area) => {
    result[area.id] = area.explorationProgress;
    return result;
  }, {});

  return {
    totalXp: mockUser.totalXp,
    totalDistanceKm: mockUser.totalDistanceKm,
    completedActivities: mockUser.completedCourses,
    selectedCharacterId,
    characterProgress,
    areaProgress,
    processedActivityIds: []
  };
}

export function getSelectedCharacterId() {
  if (!hasStorage()) {
    return mockCharacters[0].id;
  }

  return window.localStorage.getItem(selectedCharacterStorageKey) ?? mockCharacters[0].id;
}

export function setSelectedCharacterId(characterId: string) {
  if (hasStorage()) {
    window.localStorage.setItem(selectedCharacterStorageKey, characterId);
  }

  const progress = getGameProgress();
  progress.selectedCharacterId = characterId;
  progress.characterProgress[characterId] ??= {
    totalXp: 0,
    level: 1
  };
  saveGameProgress(progress);
}

export function getGameProgress(): GameProgress {
  if (!hasStorage()) {
    return createInitialProgress();
  }

  const storedProgress = window.localStorage.getItem(progressStorageKey);

  if (!storedProgress) {
    const initialProgress = createInitialProgress();
    saveGameProgress(initialProgress);
    return initialProgress;
  }

  return JSON.parse(storedProgress) as GameProgress;
}

export function saveGameProgress(progress: GameProgress) {
  if (hasStorage()) {
    window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  }
}

export function calculateActivityReward(
  course: Course,
  distanceKm: number,
  completedActivities: number
): RewardBreakdown {
  const baseXp = Math.round(distanceKm * 100);
  const multiplier = difficultyMultipliers[course.difficulty];
  const difficultyBonusXp = Math.round(baseXp * (multiplier - 1));
  const consistencyBonusXp =
    completedActivities > 0 ? Math.min(60, 20 + completedActivities * 5) : 0;

  return {
    baseXp,
    difficultyBonusXp,
    consistencyBonusXp,
    totalXp: baseXp + difficultyBonusXp + consistencyBonusXp
  };
}

export function completeActivityProgress(
  course: Course,
  summary: CompletedActivitySummary
): ProgressUpdate {
  const progress = getGameProgress();

  if (progress.processedActivityIds.includes(summary.activityId)) {
    const currentLevel = calculateLevelFromXp(progress.totalXp);
    return {
      progress,
      reward: calculateActivityReward(course, summary.distanceKm, progress.completedActivities),
      previousLevel: currentLevel,
      currentLevel,
      didLevelUp: false
    };
  }

  const previousLevel = calculateLevelFromXp(progress.totalXp);
  const reward = calculateActivityReward(course, summary.distanceKm, progress.completedActivities);
  const characterId = progress.selectedCharacterId;
  const previousCharacterProgress = progress.characterProgress[characterId] ?? {
    totalXp: 0,
    level: 1
  };

  const nextCharacterXp = previousCharacterProgress.totalXp + reward.totalXp;
  progress.totalXp += reward.totalXp;
  progress.totalDistanceKm += summary.distanceKm;
  progress.completedActivities += 1;
  progress.areaProgress[course.areaId] = Math.min(
    100,
    (progress.areaProgress[course.areaId] ?? 0) + course.explorationReward
  );
  progress.characterProgress[characterId] = {
    totalXp: nextCharacterXp,
    level: calculateLevelFromXp(nextCharacterXp)
  };
  progress.processedActivityIds.push(summary.activityId);

  const currentLevel = calculateLevelFromXp(progress.totalXp);
  saveGameProgress(progress);

  return {
    progress,
    reward,
    previousLevel,
    currentLevel,
    didLevelUp: currentLevel > previousLevel
  };
}
