import type { MockUser } from '../types/user';

export const mockUser: MockUser = {
  id: 'user-demo',
  displayName: 'Demo Explorer',
  email: 'demo@runquest.ph',
  level: 3,
  totalXp: 760,
  totalDistanceKm: 8.5,
  completedCourses: 4,
  characterName: 'The Explorer',
  currentAreaId: 'area-bgc',
  badges: ['First Quest Completed', 'First BGC Course']
};
