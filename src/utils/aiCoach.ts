import { mockAreas } from '../data/mockAreas';
import { mockCourses } from '../data/mockCourses';
import type { AiCoachMessage } from '../types/aiCoach';
import type { Course } from '../types/course';
import type { GameProgress } from './gameProgress';
import { calculateLevelFromXp } from './xp';

export function createDailyCoachMessage(progress: GameProgress): AiCoachMessage {
  const level = calculateLevelFromXp(progress.totalXp);

  if (progress.completedActivities === 0) {
    return {
      title: 'Start with a small quest',
      message:
        'A short walk is enough to wake the map. Pick an easy route and let the journey begin.',
      tone: 'steady'
    };
  }

  if (level >= 6) {
    return {
      title: 'Your city route sense is growing',
      message:
        'You have enough XP to try a longer route today, but keep the pace comfortable.',
      tone: 'push'
    };
  }

  return {
    title: 'Continue your route rhythm',
    message:
      'Your next route does not need to be intense. Clear one familiar path and bank more XP.',
    tone: 'steady'
  };
}

export function createRecoveryAdvice(progress: GameProgress) {
  if (progress.totalDistanceKm >= 20) {
    return 'You have stacked real distance. Add an easy recovery walk before chasing another hard route.';
  }

  if (progress.completedActivities >= 5) {
    return 'Your habit is forming. Keep one route light so your next quest feels fresh.';
  }

  return 'After today, hydrate and keep the next route short. Consistency beats pressure.';
}

export function recommendRoute(progress: GameProgress, areaId: string, preferredDistanceKm: number) {
  const level = calculateLevelFromXp(progress.totalXp);
  const areaCourses = mockCourses.filter((course) => course.areaId === areaId);
  const difficultyPreference = level < 4 ? ['Easy'] : ['Easy', 'Normal', 'Hard'];

  return (
    areaCourses
      .filter((course) => difficultyPreference.includes(course.difficulty))
      .sort(
        (firstCourse, secondCourse) =>
          Math.abs(firstCourse.distanceKm - preferredDistanceKm) -
          Math.abs(secondCourse.distanceKm - preferredDistanceKm)
      )[0] ??
    areaCourses[0] ??
    mockCourses[0]
  );
}

export function getAreaName(areaId: string) {
  return mockAreas.find((area) => area.id === areaId)?.name ?? 'BGC';
}

export function getRecommendationReason(course: Course, preferredDistanceKm: number) {
  const distanceGap = Math.abs(course.distanceKm - preferredDistanceKm);

  if (distanceGap <= 0.5) {
    return 'This route matches your current preferred distance.';
  }

  if (course.difficulty === 'Easy') {
    return 'This route keeps the effort beginner-friendly while still earning XP.';
  }

  return 'This route adds a bit more challenge for your current level.';
}
