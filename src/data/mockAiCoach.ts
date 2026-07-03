import type { ScaleModule, UserHabitInsight } from '../types/aiCoach';

export const mockHabitInsight: UserHabitInsight = {
  mostActiveDays: ['Tuesday', 'Saturday', 'Sunday'],
  preferredDistanceKm: 2.5,
  consistencyLabel: 'Building rhythm',
  recoveryFocus: 'Keep easy walks between harder route days.'
};

export const scaleModules: ScaleModule[] = [
  {
    id: 'multi-city',
    name: 'Multi-city route expansion',
    status: 'Ready for API',
    description: 'Areas can grow beyond BGC, Makati, and MOA into Cebu, Baguio, Clark, and more.'
  },
  {
    id: 'feature-flags',
    name: 'Modular feature system',
    status: 'Mocked',
    description: 'Rewards, community, GPS, creators, and AI coach are already separate UI modules.'
  },
  {
    id: 'ai-api',
    name: 'AI coaching API placeholder',
    status: 'Future',
    description: 'The current coach uses static rules and can later call a real coaching service.'
  },
  {
    id: 'analytics',
    name: 'Activity intelligence pipeline',
    status: 'Future',
    description: 'GPS summaries, route completions, and habits can later feed personalized insights.'
  }
];
