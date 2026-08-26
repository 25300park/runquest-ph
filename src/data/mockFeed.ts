export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  title: string;
  area: 'BGC' | 'Makati' | 'MOA';
  distanceKm: number;
  paceMinKm: string;
  durationMinutes: number;
  xpEarned: number;
  createdAt: string;
  energyCount: number;
  potionCount: number;
  hasEnergized?: boolean;
  hasPotioned?: boolean;
  routePolyline?: [number, number][];
}

export const initialFeedItems: ActivityFeedItem[] = [
  {
    id: 'feed-1',
    userId: 'user-tiger',
    userName: 'BGC_Shadow_Apex',
    avatar: '🐯',
    title: 'High Street Morning 5K Blitz',
    area: 'BGC',
    distanceKm: 5.24,
    paceMinKm: '5:12',
    durationMinutes: 27,
    xpEarned: 450,
    createdAt: '12m ago',
    energyCount: 14,
    potionCount: 6,
    routePolyline: [
      [14.5510, 121.0505],
      [14.5525, 121.0520],
      [14.5540, 121.0540],
      [14.5520, 121.0535],
      [14.5510, 121.0505]
    ]
  },
  {
    id: 'feed-2',
    userId: 'user-flash',
    userName: 'Manila_Flash',
    avatar: '⚡',
    title: 'Ayala Triangle Twilight Sprint',
    area: 'Makati',
    distanceKm: 4.10,
    paceMinKm: '4:45',
    durationMinutes: 19,
    xpEarned: 380,
    createdAt: '45m ago',
    energyCount: 22,
    potionCount: 11,
    routePolyline: [
      [14.5580, 121.0220],
      [14.5595, 121.0235],
      [14.5575, 121.0250],
      [14.5580, 121.0220]
    ]
  },
  {
    id: 'feed-3',
    userId: 'user-fox',
    userName: 'Makati_Pacer',
    avatar: '🦊',
    title: 'Greenway Trail 10K Endurance Quest',
    area: 'BGC',
    distanceKm: 10.05,
    paceMinKm: '5:35',
    durationMinutes: 56,
    xpEarned: 920,
    createdAt: '2h ago',
    energyCount: 35,
    potionCount: 18,
    routePolyline: [
      [14.5450, 121.0450],
      [14.5490, 121.0480],
      [14.5530, 121.0510],
      [14.5570, 121.0540],
      [14.5450, 121.0450]
    ]
  }
];
