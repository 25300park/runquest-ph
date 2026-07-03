import type { Difficulty } from '../types/course';

export function getDifficultyLabel(difficulty: Difficulty) {
  const labels: Record<Difficulty, string> = {
    Easy: 'Beginner-friendly',
    Normal: 'Steady route',
    Hard: 'Hard route',
    Challenge: 'Challenge route'
  };

  return labels[difficulty];
}
