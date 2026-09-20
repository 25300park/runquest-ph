import type { LatLngTuple } from '../types/area';
import { calculateHaversineDistanceKm } from './route';

/**
 * 🛰️ 1. 2D 칼만 필터 (Kalman Filter for GPS Tracking)
 * GPS 수신 좌표의 떨림(Jitter)을 제거하고, 스마트폰의 이동 관성을 반영하여 부드러운 궤적으로 보정합니다.
 * - 어반 캐니언(Urban Canyon, 고층빌딩 난반사) 대응:
 *   1) 허위 고정밀도(예: ±3m) 과신 방지 (최소 오차 바닥값 6m 적용)
 *   2) 물리적 인체 이동 한계(Max 20km/h)를 벗어난 횡방향 튐에 대한 측정 분산 페널티 및 클램핑
 */
export class GpsKalmanFilter {
  private lat = 0;
  private lng = 0;
  private variance = -1; // -1: 초기화되지 않음
  private lastTimeMs = 0;
  private readonly processNoise: number;

  constructor(processNoise = 1.8) {
    this.processNoise = processNoise; // 러닝 속도에 최적화된 프로세스 노이즈
  }

  public reset() {
    this.variance = -1;
    this.lastTimeMs = 0;
  }

  public filter(lat: number, lng: number, accuracyMeters = 5, timestampMs = Date.now()): LatLngTuple {
    // 1. 고층 빌딩 난반사 환경에서 스마트폰이 보고하는 비현실적인 초고정밀도(±1~3m) 과신 억제
    const effectiveAccuracy = Math.max(accuracyMeters, 6.0);

    if (this.variance < 0) {
      // 첫 번째 측정값 초기화
      this.lat = lat;
      this.lng = lng;
      this.lastTimeMs = timestampMs;
      this.variance = effectiveAccuracy * effectiveAccuracy;
      return [this.lat, this.lng];
    }

    const dtSec = Math.max(0.1, Math.min(5.0, (timestampMs - this.lastTimeMs) / 1000));
    this.lastTimeMs = timestampMs;

    // 2. 예측 단계 (시간 경과에 따른 분산 증가)
    this.variance += this.processNoise * this.processNoise * dtSec;

    // 3. 어반 캐니언 횡방향 비정상 점프 감지
    // 인간 러너가 dtSec 초 동안 이동 가능한 최대 물리적 거리 (약 20km/h = 5.5m/s + 버퍼)
    const maxRealisticDist = Math.max(7.0, dtSec * 5.5);
    const measuredJumpDist = calculateHaversineDistanceKm([this.lat, this.lng], [lat, lng]) * 1000;

    let measurementVariance = effectiveAccuracy * effectiveAccuracy;
    let targetLat = lat;
    let targetLng = lng;

    if (measuredJumpDist > maxRealisticDist) {
      // 비정상적인 전파 굴절 튐: 측정값 분산에 강한 페널티를 주어 칼만 이득을 낮추고 기존 관성을 유지
      const excessRatio = measuredJumpDist / maxRealisticDist;
      measurementVariance *= Math.min(10, excessRatio * excessRatio);

      // 측정 위치를 물리적 한계치 방향으로 부분 클램핑
      const clampRatio = maxRealisticDist / measuredJumpDist;
      targetLat = this.lat + (lat - this.lat) * clampRatio;
      targetLng = this.lng + (lng - this.lng) * clampRatio;
    }

    // 4. 칼만 이득 (Kalman Gain) 계산
    const kalmanGain = this.variance / (this.variance + measurementVariance);

    // 5. 상태 갱신
    this.lat += kalmanGain * (targetLat - this.lat);
    this.lng += kalmanGain * (targetLng - this.lng);
    this.variance *= 1 - kalmanGain;

    return [this.lat, this.lng];
  }
}

/**
 * 📍 2. 도로 중심선 자석 스냅 (Snap to Road / Route Line Projection)
 * GPS 좌표가 건물 위로 튀었을 때, 실제 달리고 있는 코스 도로 중심선(Route)의 가장 가까운 지점으로 자석처럼 부착합니다.
 * - 반경 45m 이내 도로 중심선으로 강력하게 밀착 (어반 캐니언 20~35m 난반사 흡수)
 * - 정확한 위도 보정 미터 단위 수직 투영 (Metric Projection)
 */
export function snapPointToRoute(
  userPos: LatLngTuple,
  routeCoordinates: LatLngTuple[],
  maxSnapDistanceMeters = 45 // 45m 이내일 때 도로 위로 강력 스냅
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

    // 현지 위도(BGC ~14.55°) 기반 미터 단위 투영 변환
    const cosLat = Math.cos(((aLat + bLat) * 0.5 * Math.PI) / 180);
    const segX = (bLng - aLng) * cosLat * 111319;
    const segY = (bLat - aLat) * 111319;
    const ptX = (pLng - aLng) * cosLat * 111319;
    const ptY = (pLat - aLat) * 111319;
    const lineLengthSq = segX * segX + segY * segY;

    let projLat = aLat;
    let projLng = aLng;

    if (lineLengthSq > 0) {
      const t = Math.max(0, Math.min(1, (ptX * segX + ptY * segY) / lineLengthSq));
      projLat = aLat + t * (bLat - aLat);
      projLng = aLng + t * (bLng - aLng);
    }

    const distMeters = calculateHaversineDistanceKm(userPos, [projLat, projLng]) * 1000;

    if (distMeters < minDistanceMeters) {
      minDistanceMeters = distMeters;
      bestSnappedPoint = [projLat, projLng];
    }
  }

  // 지정 반경(45m) 이내인 경우 도로 중심선으로 강력하게 스냅
  if (minDistanceMeters <= maxSnapDistanceMeters) {
    // 거리에 따른 계단식 자석 가중치
    // 20m 이내: 96% 도로 밀착 (오차 < 1m)
    // 35m 이내: 90% 도로 밀착 (오차 < 3m)
    // 45m 이내: 80% 도로 밀착
    let snapRatio = 0.96;
    if (minDistanceMeters > 35) {
      snapRatio = 0.80;
    } else if (minDistanceMeters > 20) {
      snapRatio = 0.90;
    }

    const smoothSnapped: LatLngTuple = [
      userPos[0] * (1 - snapRatio) + bestSnappedPoint[0] * snapRatio,
      userPos[1] * (1 - snapRatio) + bestSnappedPoint[1] * snapRatio
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
  // 1. 정확도 오차가 35m 이상인 명백한 불량 신호 기각
  if (accuracyMeters > 35) {
    return true;
  }

  if (!lastPoint || timeDiffSeconds <= 0) {
    return false;
  }

  // 2. 순간 이동 속도가 35km/h(약 9.7m/s)를 초과하는 순간 튐 기각 (보행/러닝 기준)
  const distMeters = calculateHaversineDistanceKm(lastPoint, newPoint) * 1000;
  const speedKmh = (distMeters / timeDiffSeconds) * 3.6;

  if (speedKmh > 35) {
    return true;
  }

  // 3. 0.5m 미만의 미세한 제자리 떨림은 무시
  if (distMeters < 0.5 && speedKmh < 1.0) {
    return true;
  }

  return false;
}
