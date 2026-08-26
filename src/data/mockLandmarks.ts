import type { LatLngTuple } from '../types/area';

export interface TerritoryZone {
  id: string;
  name: string;
  area: 'BGC' | 'Makati' | 'MOA';
  center: LatLngTuple;
  radiusMeters: number;
  currentRulerName: string;
  currentRulerAvatar: string;
  weeklyMileageKm: number;
  requiredMileageKm: number;
  status: 'occupied' | 'contested';
  description: string;
  rewardBuff: string;
}

export const mockTerritories: TerritoryZone[] = [
  {
    id: 'zone-bgc-greenway',
    name: 'BGC Greenway Corridor',
    area: 'BGC',
    center: [14.5455, 121.0465],
    radiusMeters: 450,
    currentRulerName: 'BGC_Shadow_Apex',
    currentRulerAvatar: '/images/avatars/3.png',
    weeklyMileageKm: 42.5,
    requiredMileageKm: 5.0,
    status: 'occupied',
    description: 'The premier green corridor of Bonifacio Global City. Longest uninterrupted pedestrian path.',
    rewardBuff: '⚡ +15% Guild XP in BGC'
  },
  {
    id: 'zone-ayala-triangle',
    name: 'Ayala Triangle Gardens',
    area: 'Makati',
    center: [14.5578, 121.0232],
    radiusMeters: 380,
    currentRulerName: 'Manila_Flash',
    currentRulerAvatar: '/images/avatars/7.png',
    weeklyMileageKm: 38.2,
    requiredMileageKm: 4.5,
    status: 'occupied',
    description: 'The heart of Makati CBD. Shaded park loop with high sprint intensity.',
    rewardBuff: '🧪 +20% Potion Drops in Makati'
  },
  {
    id: 'zone-high-street',
    name: 'Bonifacio High Street Promenade',
    area: 'BGC',
    center: [14.5515, 121.0515],
    radiusMeters: 400,
    currentRulerName: 'Makati_Pacer',
    currentRulerAvatar: '/images/avatars/11.png',
    weeklyMileageKm: 31.0,
    requiredMileageKm: 3.5,
    status: 'contested',
    description: 'Iconic open-air shopping and running boulevard. Fast-paced city strides.',
    rewardBuff: '🏃 +10% Speed Stat Buff'
  },
  {
    id: 'zone-moa-seaside',
    name: 'SM By the Bay Seaside Loop',
    area: 'MOA',
    center: [14.5350, 120.9790],
    radiusMeters: 550,
    currentRulerName: 'Coastal_Racer',
    currentRulerAvatar: '/images/avatars/18.png',
    weeklyMileageKm: 29.8,
    requiredMileageKm: 6.0,
    status: 'occupied',
    description: 'Breezy Manila Bay seaside walkway with stunning sunset routes.',
    rewardBuff: '🌊 +25% Endurance Stat Buff'
  }
];
