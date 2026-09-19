import type { LatLngTuple } from '../types/area';
import type { CheckpointType, CourseCheckpoint } from '../types/course';
import { calculateHaversineDistanceKm, calculateRouteDistanceKm } from './route';

export interface PathKeypoint {
  point: LatLngTuple;
  originalIndex: number;
  label: string;
  type: CheckpointType;
  turnAngleDeg?: number;
  distanceFromStartKm: number;
}

/**
 * 두 좌표 간의 방위각(Bearing in Degrees: 0~360도) 계산
 */
function calculateBearing(from: LatLngTuple, to: LatLngTuple): number {
  const [lat1, lon1] = from.map((deg) => (deg * Math.PI) / 180);
  const [lat2, lon2] = to.map((deg) => (deg * Math.PI) / 180);

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * 🧭 모서리 및 코너(급격한 방향 전환점) 추출 알고리즘
 * - 직선 구간의 수많은 불필요한 중간 좌표(OSRM 보간점)를 생략
 * - 출발(S), 도착(F), 그리고 방향이 20도 이상 꺾이는 진짜 코너(Corner)만 핀으로 보존
 */
export function extractCornerKeypoints(
  routePoints: LatLngTuple[],
  minTurnAngleDeg = 20,
  minSpacingMeters = 30
): PathKeypoint[] {
  if (!routePoints || routePoints.length === 0) {
    return [];
  }

  if (routePoints.length <= 2) {
    return routePoints.map((pt, idx) => ({
      point: pt,
      originalIndex: idx,
      label: idx === 0 ? 'S' : 'F',
      type: idx === 0 ? 'START' : 'FINISH',
      distanceFromStartKm: calculateRouteDistanceKm(routePoints.slice(0, idx + 1))
    }));
  }

  const keypoints: PathKeypoint[] = [];
  const totalPoints = routePoints.length;

  // 1. 출발 지점 (S) 무조건 추가
  keypoints.push({
    point: routePoints[0],
    originalIndex: 0,
    label: 'S',
    type: 'START',
    distanceFromStartKm: 0
  });

  let lastSelectedPoint = routePoints[0];
  let cornerCount = 1;

  // 2. 중간 지점 순회하며 코너(모서리) 각도 감지
  for (let i = 1; i < totalPoints - 1; i++) {
    const prev = routePoints[i - 1];
    const curr = routePoints[i];
    const next = routePoints[i + 1];

    // 진입 각도와 진출 각도 계산
    const bearingIn = calculateBearing(prev, curr);
    const bearingOut = calculateBearing(curr, next);

    let angleDiff = Math.abs(bearingOut - bearingIn);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }

    // 이전 키포인트와의 거리(m)
    const distFromLastMeters = calculateHaversineDistanceKm(lastSelectedPoint, curr) * 1000;

    // 조건: 각도 변화가 20도 이상이면서, 최소 30m 이상 떨어져 있는 경우 (진짜 교차로/코너)
    if (angleDiff >= minTurnAngleDeg && distFromLastMeters >= minSpacingMeters) {
      keypoints.push({
        point: curr,
        originalIndex: i,
        label: String(cornerCount),
        type: 'CHECKPOINT',
        turnAngleDeg: Math.round(angleDiff),
        distanceFromStartKm: calculateRouteDistanceKm(routePoints.slice(0, i + 1))
      });
      lastSelectedPoint = curr;
      cornerCount++;
    }
  }

  // 3. 도착 지점 (F) 무조건 추가
  keypoints.push({
    point: routePoints[totalPoints - 1],
    originalIndex: totalPoints - 1,
    label: 'F',
    type: 'FINISH',
    distanceFromStartKm: calculateRouteDistanceKm(routePoints)
  });

  return keypoints;
}

/**
 * 📍 CourseBuilder 전용 최적화 체크포인트 생성기
 * 24개 난립을 방지하고 핵심 코너만 CourseCheckpoint[] 로 변환
 */
export function buildOptimizedCheckpoints(routePoints: LatLngTuple[]): CourseCheckpoint[] {
  const keypoints = extractCornerKeypoints(routePoints, 20, 30);

  return keypoints.map((kp, idx) => ({
    id: `checkpoint-opt-${idx}-${kp.originalIndex}`,
    name: kp.type === 'START' ? 'Start' : kp.type === 'FINISH' ? 'Finish' : `Corner ${kp.label}`,
    type: kp.type,
    position: kp.point,
    distanceFromStartKm: kp.distanceFromStartKm
  }));
}
