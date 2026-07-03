export type UserHabitInsight = {
  mostActiveDays: string[];
  preferredDistanceKm: number;
  consistencyLabel: string;
  recoveryFocus: string;
};

export type AiCoachMessage = {
  title: string;
  message: string;
  tone: 'steady' | 'push' | 'recovery';
};

export type ScaleModule = {
  id: string;
  name: string;
  status: 'Mocked' | 'Ready for API' | 'Future';
  description: string;
};
