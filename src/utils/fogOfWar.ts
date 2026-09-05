import type { LatLngTuple } from '../types/area';

export interface AreaExplorationStats {
  areaId: string;
  areaName: string;
  revealedPercentage: number;
  totalKmCovered: number;
  unlockedSectors: number;
  totalSectors: number;
}

const STORAGE_KEY = 'rq_exploration_stats_v1';
const BREADCRUMBS_KEY = 'rq_explored_breadcrumbs_v1';

export const defaultExplorationStats: AreaExplorationStats[] = [
  {
    areaId: 'area-bgc',
    areaName: 'Bonifacio Global City',
    revealedPercentage: 42,
    totalKmCovered: 36.8,
    unlockedSectors: 8,
    totalSectors: 15
  },
  {
    areaId: 'area-makati',
    areaName: 'Makati CBD & Ayala',
    revealedPercentage: 28,
    totalKmCovered: 22.4,
    unlockedSectors: 4,
    totalSectors: 12
  },
  {
    areaId: 'area-moa',
    areaName: 'MOA & Pasay Bay',
    revealedPercentage: 15,
    totalKmCovered: 12.0,
    unlockedSectors: 2,
    totalSectors: 10
  }
];

export function getSavedExplorationStats(): AreaExplorationStats[] {
  if (typeof window === 'undefined') return defaultExplorationStats;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultExplorationStats;
  } catch {
    return defaultExplorationStats;
  }
}

export function saveExplorationStats(stats: AreaExplorationStats[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function recordExplorationDistance(areaId: string, additionalKm: number): AreaExplorationStats[] {
  const currentStats = getSavedExplorationStats();
  const updated = currentStats.map((stat) => {
    if (stat.areaId === areaId) {
      const newKm = Number((stat.totalKmCovered + additionalKm).toFixed(2));
      const percentageGain = Math.round(additionalKm * 2.5);
      const newPercentage = Math.min(100, stat.revealedPercentage + percentageGain);
      const newSectors = Math.min(stat.totalSectors, Math.floor((newPercentage / 100) * stat.totalSectors));
      return {
        ...stat,
        totalKmCovered: newKm,
        revealedPercentage: newPercentage,
        unlockedSectors: Math.max(stat.unlockedSectors, newSectors)
      };
    }
    return stat;
  });
  saveExplorationStats(updated);
  return updated;
}

export function getExploredBreadcrumbs(): LatLngTuple[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(BREADCRUMBS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveExploredBreadcrumbs(points: LatLngTuple[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BREADCRUMBS_KEY, JSON.stringify(points.slice(-500))); // 최근 500개 유지
  } catch {
    // ignore
  }
}

export function calculateExplorationProgress(pointsCount: number, basePercent = 42): number {
  return Math.min(100, Math.round(basePercent + pointsCount * 0.8));
}
