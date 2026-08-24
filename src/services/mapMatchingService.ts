import type { LatLngTuple } from '../types/area';

export interface MapMatchingOptions {
  provider?: 'osrm' | 'google_roads' | 'mapbox' | 'mock';
  interpolate?: boolean;
}

export interface MapMatchingResult {
  matchedPoints: LatLngTuple[];
  originalCount: number;
  matchedCount: number;
  confidence?: number;
}

/**
 * GPS 좌표 배열을 OpenStreetMap OSRM Match/Route API를 통해
 * 실제 도로망(Road Network)에 정밀 스냅(Snap to Road)하여 보정된 좌표 배열을 반환합니다.
 */
export async function snapToRoad(
  points: LatLngTuple[],
  _options: MapMatchingOptions = { provider: 'osrm', interpolate: true }
): Promise<MapMatchingResult> {
  if (points.length < 2) {
    return {
      matchedPoints: points,
      originalCount: points.length,
      matchedCount: points.length,
      confidence: 1.0
    };
  }

  try {
    // 1. OSRM API 형식에 맞게 lng,lat;lng,lat 문자열 생성 (OSRM은 경도,위도 순서)
    const coordinatesQuery = points
      .map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
      .join(';');

    // 2. OpenStreetMap OSRM 매칭 API 호출 (도보/러닝 최적화 또는 도로 라우팅)
    const response = await fetch(
      `https://router.project-osrm.org/match/v1/foot/${coordinatesQuery}?geometries=geojson&overview=full&steps=false`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (!response.ok) {
      throw new Error(`OSRM Match API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
      // 매칭된 GeoJSON geometry ([lng, lat] 배열) 추출 후 [lat, lng]로 변환
      const matchedGeometry: [number, number][] = data.matchings[0].geometry.coordinates;
      const matchedPoints: LatLngTuple[] = matchedGeometry.map(([lng, lat]) => [lat, lng]);

      console.log('✅ [MapMatching] OSRM 도로망 매칭 성공:', {
        original: points.length,
        matched: matchedPoints.length,
        confidence: data.matchings[0].confidence
      });

      return {
        matchedPoints,
        originalCount: points.length,
        matchedCount: matchedPoints.length,
        confidence: data.matchings[0].confidence ?? 0.95
      };
    }
  } catch (error) {
    console.warn('⚠️ [MapMatching] OSRM 호출 실패 또는 Fallback 동작:', error);
  }

  // Fallback: 네트워크 오류 시 이동평균 기반 지터링 스무딩(Smoothing) 적용
  const smoothedPoints: LatLngTuple[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      smoothedPoints.push(points[i]);
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      smoothedPoints.push([
        (prev[0] + curr[0] * 2 + next[0]) / 4,
        (prev[1] + curr[1] * 2 + next[1]) / 4
      ]);
    }
  }

  return {
    matchedPoints: smoothedPoints,
    originalCount: points.length,
    matchedCount: smoothedPoints.length,
    confidence: 0.85
  };
}
