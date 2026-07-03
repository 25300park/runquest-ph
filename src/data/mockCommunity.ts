import type {
  Challenge,
  LeaderboardPeriod,
  LeaderboardUser,
  RunningGroup,
  SocialFeedPost
} from '../types/community';

export const runningGroups: RunningGroup[] = [
  {
    id: 'group-bgc-vanguard',
    name: 'BGC Vanguard',
    area: 'BGC',
    theme: 'Neon city runners',
    totalXp: 18400,
    totalDistanceKm: 312,
    memberCount: 42,
    description: 'Morning loops, office-worker pace groups, and city route scouting.'
  },
  {
    id: 'group-makati-grove',
    name: 'Makati Grove Runners',
    area: 'Makati',
    theme: 'Golden triangle guild',
    totalXp: 15150,
    totalDistanceKm: 268,
    memberCount: 36,
    description: 'Sunday city runs, shaded routes, and steady midweek challenges.'
  },
  {
    id: 'group-moa-horizon',
    name: 'MOA Horizon Crew',
    area: 'MOA',
    theme: 'Bayfront explorers',
    totalXp: 12900,
    totalDistanceKm: 241,
    memberCount: 31,
    description: 'Sunset walks, seaside jogs, and relaxed long-path quests.'
  }
];

export const leaderboardUsers: Record<LeaderboardPeriod, LeaderboardUser[]> = {
  daily: [
    {
      id: 'daily-1',
      name: 'Mika',
      title: 'Street Explorer',
      xp: 680,
      distanceKm: 6.8,
      streakDays: 4
    },
    {
      id: 'daily-2',
      name: 'Carlo',
      title: 'Route Adventurer',
      xp: 540,
      distanceKm: 5.4,
      streakDays: 3
    },
    {
      id: 'daily-3',
      name: 'Demo Explorer',
      title: 'City Jogger',
      xp: 420,
      distanceKm: 4.2,
      streakDays: 2
    }
  ],
  weekly: [
    {
      id: 'weekly-1',
      name: 'Rina',
      title: 'Urban Runner',
      xp: 2800,
      distanceKm: 28,
      streakDays: 6
    },
    {
      id: 'weekly-2',
      name: 'Demo Explorer',
      title: 'City Jogger',
      xp: 2140,
      distanceKm: 18.5,
      streakDays: 4
    },
    {
      id: 'weekly-3',
      name: 'Jun',
      title: 'Bay Scout',
      xp: 1930,
      distanceKm: 17.2,
      streakDays: 5
    }
  ],
  monthly: [
    {
      id: 'monthly-1',
      name: 'Team Captain Aya',
      title: 'Island Explorer',
      xp: 9200,
      distanceKm: 82,
      streakDays: 16
    },
    {
      id: 'monthly-2',
      name: 'Marco',
      title: 'Challenge Runner',
      xp: 8750,
      distanceKm: 78,
      streakDays: 12
    },
    {
      id: 'monthly-3',
      name: 'Demo Explorer',
      title: 'City Jogger',
      xp: 6400,
      distanceKm: 55,
      streakDays: 9
    }
  ]
};

export const communityChallenges: Challenge[] = [
  {
    id: 'challenge-5k',
    title: '5km Solo Quest',
    challengeType: 'Solo',
    description: 'Clear any route until your weekly distance reaches 5km.',
    progress: 3.2,
    target: 5,
    unit: 'km',
    reward: '+300 XP'
  },
  {
    id: 'challenge-10k-week',
    title: '10km Weekly Goal',
    challengeType: 'Solo',
    description: 'Build consistency by reaching 10km across multiple routes.',
    progress: 6.8,
    target: 10,
    unit: 'km',
    reward: 'Weekly Badge'
  },
  {
    id: 'challenge-team-vs-team',
    title: 'BGC vs Makati Team Clash',
    challengeType: 'Group',
    description: 'Two city crews compete by collecting XP from completed routes.',
    progress: 12400,
    target: 20000,
    unit: 'XP',
    reward: 'Guild Banner'
  }
];

export const socialFeedPosts: SocialFeedPost[] = [
  {
    id: 'feed-1',
    userName: 'Mika',
    groupName: 'BGC Vanguard',
    routeName: 'BGC Morning Loop',
    distanceKm: 2.5,
    xpGained: 310,
    postedAt: 'Today'
  },
  {
    id: 'feed-2',
    userName: 'Jun',
    groupName: 'MOA Horizon Crew',
    routeName: 'MOA Bay Walk',
    distanceKm: 3,
    xpGained: 390,
    postedAt: 'Yesterday'
  },
  {
    id: 'feed-3',
    userName: 'Rina',
    groupName: 'Makati Grove Runners',
    routeName: 'Ayala Triangle Green Route',
    distanceKm: 2.2,
    xpGained: 260,
    postedAt: '2 days ago'
  }
];
