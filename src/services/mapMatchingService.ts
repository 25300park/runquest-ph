import type { LatLngTuple } from '../types/area';

export interface MapMatchingOptions {
  provider?: 'google_roads' | 'mapbox' | 'mock';
  interpolate?: boolean;
}

export interface MapMatchingResult {
  matchedPoints: LatLngTuple[];
  originalCount: number;
  matchedCount: number;
  confidence?: number;
}

/**
 * GPS 좌표 배열을 도로망에 스냅(Snap to Road)하여 보정된 좌표 배열을 반환합니다.
 * 향후 Google Maps Roads API 또는 Mapbox API 엔드포인트 연동이 가능하도록 설계되었습니다.
 */
export async function snapToRoad(
  points: LatLngTuple[],
  options: MapMatchingOptions = { provider: 'mock', interpolate: true }
): Promise<MapMatchingResult> {
  // eslint-disable-next-line no-console
  console.log(
    `[MapMatching] SnapToRoad API 호출됨: provider=${options.provider}, pointsCount=${points.length}`
  );

  if (points.length < 2) {
    return {
      matchedPoints: points,
      originalCount: points.length,
      matchedCount: points.length,
      confidence: 1.0
    };
  }

  // TODO: 추후 Google Maps Roads API(Snap to Roads) 또는 Mapbox API 실제 연동
  // const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  // const response = await fetch(`https://roads.googleapis.com/v1/snapToRoads?...`);

  // Mocking: 도로망 정밀 매칭 시뮬레이션 (1.2초 딜레이)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    matchedPoints: [...points],
    originalCount: points.length,
    matchedCount: points.length,
    confidence: 0.98
  };
}
