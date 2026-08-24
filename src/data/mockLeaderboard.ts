export interface MonthlyRunnerRank {
  id: string;
  rank: number;
  runnerName: string;
  avatar: string;
  characterTitle: string;
  monthlyScore: number;
  monthlyDistanceKm: number;
  monthlyXp: number;
  completedQuests: number;
  isCurrentUser?: boolean;
}

export const currentMonthRunners: MonthlyRunnerRank[] = [
  {
    id: 'runner-1',
    rank: 1,
    runnerName: 'BGC_Shadow_Apex',
    avatar: '🐯',
    characterTitle: 'Legendary Tiger Ranger',
    monthlyScore: 12850,
    monthlyDistanceKm: 142.5,
    monthlyXp: 18400,
    completedQuests: 28
  },
  {
    id: 'runner-2',
    rank: 2,
    runnerName: 'Manila_Flash',
    avatar: '⚡',
    characterTitle: 'Elite Storm Runner',
    monthlyScore: 11200,
    monthlyDistanceKm: 125.0,
    monthlyXp: 15900,
    completedQuests: 24
  },
  {
    id: 'runner-3',
    rank: 3,
    runnerName: 'Makati_Pacer',
    avatar: '🦊',
    characterTitle: 'Swift Fox Vanguard',
    monthlyScore: 9840,
    monthlyDistanceKm: 110.2,
    monthlyXp: 13800,
    completedQuests: 21
  },
  {
    id: 'runner-4',
    rank: 4,
    runnerName: 'Ayala_Knight',
    avatar: '🐺',
    characterTitle: 'Night Wolf Sprinter',
    monthlyScore: 8750,
    monthlyDistanceKm: 98.4,
    monthlyXp: 12100,
    completedQuests: 19
  },
  {
    id: 'runner-5',
    rank: 5,
    runnerName: 'Taguig_Stride',
    avatar: '🦅',
    characterTitle: 'Sky Hawk Pacer',
    monthlyScore: 7920,
    monthlyDistanceKm: 88.0,
    monthlyXp: 10950,
    completedQuests: 17
  },
  {
    id: 'runner-6',
    rank: 6,
    runnerName: 'RunMaster_PH',
    avatar: '🦁',
    characterTitle: 'Lion Heart Explorer',
    monthlyScore: 6840,
    monthlyDistanceKm: 76.5,
    monthlyXp: 9400,
    completedQuests: 15
  },
  {
    id: 'runner-7',
    rank: 7,
    runnerName: 'Coastal_Racer',
    avatar: '🐬',
    characterTitle: 'Ocean Wave Dasher',
    monthlyScore: 5930,
    monthlyDistanceKm: 65.2,
    monthlyXp: 8100,
    completedQuests: 13
  },
  {
    id: 'runner-current',
    rank: 8,
    runnerName: 'Demo Explorer (You)',
    avatar: '🧙',
    characterTitle: 'Novice Adventurer',
    monthlyScore: 5120,
    monthlyDistanceKm: 58.4,
    monthlyXp: 7200,
    completedQuests: 11,
    isCurrentUser: true
  },
  {
    id: 'runner-9',
    rank: 9,
    runnerName: 'HighStreet_Hero',
    avatar: '🐻',
    characterTitle: 'Bear Fortress Runner',
    monthlyScore: 4680,
    monthlyDistanceKm: 52.0,
    monthlyXp: 6400,
    completedQuests: 10
  },
  {
    id: 'runner-10',
    rank: 10,
    runnerName: 'Urban_Phantom',
    avatar: '🐱',
    characterTitle: 'Shadow Cat Dasher',
    monthlyScore: 4150,
    monthlyDistanceKm: 46.8,
    monthlyXp: 5800,
    completedQuests: 9
  }
];

export const pastMonthRunners: MonthlyRunnerRank[] = [
  {
    id: 'past-1',
    rank: 1,
    runnerName: 'Manila_Flash',
    avatar: '⚡',
    characterTitle: 'Elite Storm Runner',
    monthlyScore: 16400,
    monthlyDistanceKm: 180.5,
    monthlyXp: 22000,
    completedQuests: 36
  },
  {
    id: 'past-2',
    rank: 2,
    runnerName: 'BGC_Shadow_Apex',
    avatar: '🐯',
    characterTitle: 'Legendary Tiger Ranger',
    monthlyScore: 15100,
    monthlyDistanceKm: 168.0,
    monthlyXp: 20500,
    completedQuests: 33
  },
  {
    id: 'past-3',
    rank: 3,
    runnerName: 'Ayala_Knight',
    avatar: '🐺',
    characterTitle: 'Night Wolf Sprinter',
    monthlyScore: 13200,
    monthlyDistanceKm: 145.2,
    monthlyXp: 17800,
    completedQuests: 28
  },
  {
    id: 'past-4',
    rank: 4,
    runnerName: 'Makati_Pacer',
    avatar: '🦊',
    characterTitle: 'Swift Fox Vanguard',
    monthlyScore: 11900,
    monthlyDistanceKm: 130.0,
    monthlyXp: 15400,
    completedQuests: 25
  },
  {
    id: 'past-5',
    rank: 5,
    runnerName: 'Taguig_Stride',
    avatar: '🦅',
    characterTitle: 'Sky Hawk Pacer',
    monthlyScore: 10400,
    monthlyDistanceKm: 115.5,
    monthlyXp: 13900,
    completedQuests: 22
  }
];
