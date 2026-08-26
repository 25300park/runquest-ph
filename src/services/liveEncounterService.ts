import type { LatLngTuple } from '../types/area';
import { calculateHaversineDistanceKm } from '../utils/route';

export interface LiveNearbyRunner {
  id: string;
  name: string;
  avatar: string;
  currentPosition: LatLngTuple;
  paceMinKm: string;
  distanceKm: number;
}

export function generateNearbyRunners(center: LatLngTuple): LiveNearbyRunner[] {
  const [lat, lng] = center;
  return [
    {
      id: 'runner-live-1',
      name: 'BGC_Shadow_Apex',
      avatar: '/images/avatars/2.png',
      currentPosition: [lat + 0.0012, lng + 0.0015],
      paceMinKm: '5:10',
      distanceKm: 4.8
    },
    {
      id: 'runner-live-2',
      name: 'Manila_Flash',
      avatar: '/images/avatars/5.png',
      currentPosition: [lat - 0.0018, lng + 0.0009],
      paceMinKm: '4:52',
      distanceKm: 3.2
    },
    {
      id: 'runner-live-3',
      name: 'Makati_Pacer',
      avatar: '/images/avatars/8.png',
      currentPosition: [lat + 0.0006, lng - 0.0014],
      paceMinKm: '5:28',
      distanceKm: 6.1
    }
  ];
}

export function checkHighFiveProximity(
  userPos: LatLngTuple,
  nearbyRunners: LiveNearbyRunner[]
): LiveNearbyRunner | null {
  for (const runner of nearbyRunners) {
    const distKm = calculateHaversineDistanceKm(userPos, runner.currentPosition);
    // 30m(0.03km) 이내 근접 시 하이파이브 트리거
    if (distKm <= 0.04) {
      return runner;
    }
  }
  return null;
}
