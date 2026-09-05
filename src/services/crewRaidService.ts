import type { LatLngTuple } from '../types/area';
import { calculateHaversineDistanceKm } from '../utils/route';

export interface CrewRaidEvent {
  id: string;
  title: string;
  locationName: string;
  targetCoord: LatLngTuple;
  geofenceRadiusMeters: number; // 50m
  startTime: string;
  targetSecondsLeft: number;
  totalParticipants: number;
  participantAvatars: string[];
  rewardXp: number;
  rewardGold: number;
  rewardBadge: string;
  description: string;
  bossMonsterName: string;
  bossMonsterIcon: string;
}

export const defaultBgcRaid: CrewRaidEvent = {
  id: 'raid-bgc-amphitheater',
  title: 'BGC Amphitheater Midnight Cyber Raid',
  locationName: 'BGC High Street Amphitheater',
  targetCoord: [14.5515, 121.0515],
  geofenceRadiusMeters: 50,
  startTime: '매주 토/일 밤 9:00 집결',
  targetSecondsLeft: 7200, // 2시간
  totalParticipants: 48,
  participantAvatars: [
    '/images/avatars/1.png',
    '/images/avatars/2.png',
    '/images/avatars/3.png',
    '/images/avatars/4.png',
    '/images/avatars/5.png',
    '/images/avatars/6.png'
  ],
  rewardXp: 500,
  rewardGold: 100,
  rewardBadge: 'BGC Raid Conqueror',
  description: 'BGC 중심 광장에 48명의 러너가 모여 보스 몬스터를 격파하고 대규모 보상을 획득하세요!',
  bossMonsterName: 'Cyber Mecha Panther',
  bossMonsterIcon: '🐆'
};

export function checkGeofenceInside(userCoord: LatLngTuple, targetCoord: LatLngTuple, radiusMeters = 50): { isInside: boolean; distanceMeters: number } {
  const distKm = calculateHaversineDistanceKm(userCoord, targetCoord);
  const distanceMeters = Math.round(distKm * 1000);
  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters
  };
}
