import type { LatLngTuple } from '../types/area';

const earthRadiusKm = 6371;

export function getRouteCenter(route: LatLngTuple[]): LatLngTuple {
  if (route.length === 0) {
    return [14.5503, 121.0507];
  }

  const totals = route.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]] as LatLngTuple,
    [0, 0] as LatLngTuple
  );

  return [totals[0] / route.length, totals[1] / route.length];
}

export function calculateHaversineDistanceKm(from: LatLngTuple, to: LatLngTuple) {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const deltaLat = ((to[0] - from[0]) * Math.PI) / 180;
  const deltaLng = ((to[1] - from[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function calculateRouteProgress(position: LatLngTuple, route: LatLngTuple[]) {
  if (route.length < 2) {
    return {
      completedSegment: route,
      progressPercent: 0
    };
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  route.forEach((routePoint, index) => {
    const distance = calculateHaversineDistanceKm(position, routePoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    completedSegment: route.slice(0, nearestIndex + 1),
    progressPercent: Math.round((nearestIndex / (route.length - 1)) * 100)
  };
}
