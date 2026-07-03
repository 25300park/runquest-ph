import { mockCourses } from '../data/mockCourses';
import type { Course } from '../types/course';
import type { GameProgress } from './gameProgress';
import { calculateLevelFromXp } from './xp';

export type CourseRecommendationSet = {
  recommendedRun: Course;
  recoveryRun: Course;
  challengeRun: Course;
};

function nearestDistanceCourse(courses: Course[], targetDistanceKm: number) {
  return [...courses].sort(
    (firstCourse, secondCourse) =>
      Math.abs(firstCourse.distanceKm - targetDistanceKm) -
      Math.abs(secondCourse.distanceKm - targetDistanceKm)
  )[0];
}

export function createCourseRecommendations(
  progress: GameProgress,
  preferredDistanceKm: number
): CourseRecommendationSet {
  const level = calculateLevelFromXp(progress.totalXp);
  const easyCourses = mockCourses.filter((course) => course.difficulty === 'Easy');
  const normalCourses = mockCourses.filter((course) => course.difficulty === 'Normal');
  const longerCourses = mockCourses.filter((course) => course.distanceKm >= preferredDistanceKm);

  return {
    recommendedRun:
      nearestDistanceCourse(level < 4 ? easyCourses : mockCourses, preferredDistanceKm) ??
      mockCourses[0],
    recoveryRun: nearestDistanceCourse(easyCourses, Math.max(1.5, preferredDistanceKm - 1)) ?? mockCourses[0],
    challengeRun:
      nearestDistanceCourse(level < 5 ? normalCourses : longerCourses, preferredDistanceKm + 2) ??
      mockCourses[mockCourses.length - 1]
  };
}
