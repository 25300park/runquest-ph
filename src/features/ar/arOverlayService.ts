import type { LatLngTuple } from '../../types/area';
import type { CourseCheckpoint } from '../../types/course';
import { calculateHaversineDistanceKm } from '../../utils/route';

export type ArOverlayKind = 'route_arrow' | 'distance_marker' | 'checkpoint';

export type ArOverlay = {
  id: string;
  kind: ArOverlayKind;
  label: string;
  position: LatLngTuple;
  distanceFromUserKm: number;
};

export function isArSupported() {
  const hasCamera = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  return {
    cameraOverlay: hasCamera,
    webXr: typeof navigator !== 'undefined' && 'xr' in navigator,
    nativeFallback: 'ARKit/ARCore requires a native wrapper. Camera overlay is used in the PWA.'
  };
}

export async function requestCameraOverlay() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera overlay is not available in this browser.');
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment'
    },
    audio: false
  });
}

function nearestRouteIndex(route: LatLngTuple[], currentPosition: LatLngTuple) {
  return route.reduce(
    (nearest, point, index) => {
      const distance = calculateHaversineDistanceKm(currentPosition, point);
      return distance < nearest.distance ? { index, distance } : nearest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY }
  ).index;
}

export function createRouteArrowOverlay(route: LatLngTuple[], currentPosition: LatLngTuple): ArOverlay | null {
  if (route.length < 2) {
    return null;
  }

  const nearestIndex = nearestRouteIndex(route, currentPosition);
  const nextPoint = route[Math.min(nearestIndex + 1, route.length - 1)];

  return {
    id: `route-arrow-${nearestIndex}`,
    kind: 'route_arrow',
    label: 'Next path',
    position: nextPoint,
    distanceFromUserKm: calculateHaversineDistanceKm(currentPosition, nextPoint)
  };
}

export function createDistanceMarkers(route: LatLngTuple[], currentPosition: LatLngTuple, intervalKm = 0.5) {
  const overlays: ArOverlay[] = [];
  let accumulated = 0;
  let nextMarkerAt = intervalKm;

  route.slice(1).forEach((point, index) => {
    const previous = route[index];
    accumulated += calculateHaversineDistanceKm(previous, point);

    if (accumulated >= nextMarkerAt) {
      overlays.push({
        id: `distance-marker-${nextMarkerAt.toFixed(1)}`,
        kind: 'distance_marker',
        label: `${nextMarkerAt.toFixed(1)} km`,
        position: point,
        distanceFromUserKm: calculateHaversineDistanceKm(currentPosition, point)
      });
      nextMarkerAt += intervalKm;
    }
  });

  return overlays;
}

export function createCheckpointOverlay(
  checkpoints: CourseCheckpoint[],
  currentPosition: LatLngTuple
): ArOverlay[] {
  return checkpoints.map((checkpoint) => ({
    id: `checkpoint-${checkpoint.id}`,
    kind: 'checkpoint',
    label: checkpoint.name,
    position: checkpoint.position,
    distanceFromUserKm: calculateHaversineDistanceKm(currentPosition, checkpoint.position)
  }));
}

export function buildRunningArOverlays(input: {
  route: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  currentPosition: LatLngTuple;
}) {
  const routeArrow = createRouteArrowOverlay(input.route, input.currentPosition);

  return [
    ...(routeArrow ? [routeArrow] : []),
    ...createDistanceMarkers(input.route, input.currentPosition),
    ...createCheckpointOverlay(input.checkpoints, input.currentPosition)
  ].sort((a, b) => a.distanceFromUserKm - b.distanceFromUserKm);
}
