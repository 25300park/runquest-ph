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
    avatar: '/images/avatars/4.png',
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
    avatar: '/images/avatars/6.png',
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
      [14.5560, 121.0230]
    ]
  },
  {
    id: 'feed-3',
    userId: 'user-pacer',
    userName: 'Makati_Pacer',
    avatar: '/images/avatars/9.png',
    title: 'MOA Sunset Endurance Run',
    area: 'MOA',
    distanceKm: 6.80,
    paceMinKm: '5:30',
    durationMinutes: 37,
    xpEarned: 520,
    createdAt: '2h ago',
    energyCount: 31,
    potionCount: 19,
    routePolyline: [
      [14.5340, 120.9780],
      [14.5370, 120.9800],
      [14.5390, 120.9790]
    ]
  }
];
