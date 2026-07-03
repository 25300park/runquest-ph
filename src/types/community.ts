export type RunningGroup = {
  id: string;
  name: string;
  area: 'BGC' | 'Makati' | 'MOA';
  theme: string;
  totalXp: number;
  totalDistanceKm: number;
  memberCount: number;
  description: string;
};

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export type LeaderboardUser = {
  id: string;
  name: string;
  title: string;
  xp: number;
  distanceKm: number;
  streakDays: number;
};

export type Challenge = {
  id: string;
  title: string;
  challengeType: 'Solo' | 'Group';
  description: string;
  progress: number;
  target: number;
  unit: 'km' | 'XP';
  reward: string;
};

export type SocialFeedPost = {
  id: string;
  userName: string;
  groupName: string;
  routeName: string;
  distanceKm: number;
  xpGained: number;
  postedAt: string;
};
