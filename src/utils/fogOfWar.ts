export interface AreaExplorationStats {
  areaId: string;
  areaName: string;
  revealedPercentage: number;
  totalKmCovered: number;
  unlockedSectors: number;
  totalSectors: number;
}

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

export function calculateExplorationProgress(pointsCount: number, basePercent = 42): number {
  const increment = Math.min(100, Math.round(basePercent + pointsCount * 0.8));
  return increment;
}
