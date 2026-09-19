import type { LatLngTuple } from '../types/area';
import { calculateHaversineDistanceKm } from './route';

/**
 * 🛰️ 1. 2D 칼만 필터 (Kalman Filter for GPS Tracking)
 * GPS 수신 좌표의 떨림(Jitter)을 제거하고, 스마트폰의 이동 관성을 반영하여 부드러운 궤적으로 보정합니다.
 */
export class GpsKalmanFilter {
  private lat = 0;
  private lng = 0;
  private variance = -1; // -1: 초기화되지 않음
  private readonly processNoise: number;

  constructor(processNoise = 3.0) {
    this.processNoise = processNoise; // 러닝 속도에 최적화된 프로세스 노이즈
  }

  public reset() {
    this.variance = -1;
  }

  public filter(lat: number, lng: number, accuracyMeters = 5, _timestampMs = Date.now()): LatLngTuple {
    const accuracy = Math.max(accuracyMeters, 1); // 0 방지

    if (this.variance < 0) {
      // 첫 번째 측정값 초기화
      this.lat = lat;
      this.lng = lng;
      this.variance = accuracy * accuracy;
      return [this.lat, this.lng];
    }

    // 예측 단계 (시간 경과에 따른 분산 증가)
    this.variance += this.processNoise * this.processNoise;

    // 칼만 이득 (Kalman Gain) 계산
    const measurementVariance = accuracy * accuracy;
    const kalmanGain = this.variance / (this.variance + measurementVariance);

    // 상태 갱신
    this.lat += kalmanGain * (lat - this.lat);
    this.lng += kalmanGain * (lng - this.lng);
    this.variance *= 1 - kalmanGain;

    return [this.lat, this.lng];
  }
}

/**
 * 📍 2. 도로 중심선 자석 스냅 (Snap to Road / Route Line Projection)
 * GPS 좌표가 건물 위로 튀었을 때, 실제 달리고 있는 코스 도로 중심선(Route)의 가장 가까운 지점으로 자석처럼 부착합니다.
 */
export function snapPointToRoute(
  userPos: LatLngTuple,
  routeCoordinates: LatLngTuple[],
  maxSnapDistanceMeters = 28 // 28m 이내일 때 도로 위로 스냅
): { snappedPosition: LatLngTuple; isSnapped: boolean; distanceToRoadMeters: number } {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return { snappedPosition: userPos, isSnapped: false, distanceToRoadMeters: 0 };
  }

  let minDistanceMeters = Infinity;
  let bestSnappedPoint: LatLngTuple = userPos;

  const [pLat, pLng] = userPos;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const [aLat, aLng] = routeCoordinates[i];
    const [bLat, bLng] = routeCoordinates[i + 1];

    // 선분 AB에 점 P를 수직 투영 (Projection)
    const dx = bLng - aLng;
    const dy = bLat - aLat;
    const lineLengthSq = dx * dx + dy * dy;

    let projLat = aLat;
    let projLng = aLng;

    if (lineLengthSq > 0) {
      const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / lineLengthSq));
      projLat = aLat + t * dy;
      projLng = aLng + t * dx;
    }

    const distMeters = calculateHaversineDistanceKm(userPos, [projLat, projLng]) * 1000;

    if (distMeters < minDistanceMeters) {
      minDistanceMeters = distMeters;
      bestSnappedPoint = [projLat, projLng];
    }
  }

  // 지정 반경(28m) 이내인 경우 도로 중심선으로 부드럽게 스냅 (70% 스냅 가중치)
  if (minDistanceMeters <= maxSnapDistanceMeters) {
    const smoothSnapped: LatLngTuple = [
      userPos[0] * 0.25 + bestSnappedPoint[0] * 0.75,
      userPos[1] * 0.25 + bestSnappedPoint[1] * 0.75
    ];
    return {
      snappedPosition: smoothSnapped,
      isSnapped: true,
      distanceToRoadMeters: minDistanceMeters
    };
  }

  return {
    snappedPosition: userPos,
    isSnapped: false,
    distanceToRoadMeters: minDistanceMeters
  };
}

/**
 * 🛡️ 3. 이상치 및 제자리 떨림(Jitter) 필터링
 */
export function isGpsOutlier(
  newPoint: LatLngTuple,
  lastPoint: LatLngTuple | null,
  timeDiffSeconds: number,
  accuracyMeters: number
): boolean {
  // 1. 정확도 오차가 30m 이상인 불량 신호 기각
  if (accuracyMeters > 30) {
    return true;
  }

  if (!lastPoint || timeDiffSeconds <= 0) {
    return false;
  }

  // 2. 순간 이동 속도가 40km/h(약 11m/s)를 초과하는 순간 튐 기각 (자동차/GPS 순간 오류 방지)
  const distMeters = calculateHaversineDistanceKm(lastPoint, newPoint) * 1000;
  const speedKmh = (distMeters / timeDiffSeconds) * 3.6;

  if (speedKmh > 40) {
    return true;
  }

  // 3. 0.8m 미만의 미세한 제자리 떨림은 무시
  if (distMeters < 0.8 && speedKmh < 1.5) {
    return true;
  }

  return false;
}
