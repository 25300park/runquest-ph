import type { Area } from '../types/area';

export const mockAreas: Area[] = [
  {
    id: 'area-bgc',
    code: 'bgc',
    name: 'BGC',
    city: 'Taguig',
    description: 'Modern city routes, safe loops, and office worker-friendly courses.',
    theme: 'Modern city loop',
    explorationVibe: 'Glass towers, wide sidewalks, morning energy, and beginner-friendly loops.',
    worldZone: 'Neon City Gate',
    mapCenter: [14.5503, 121.0507],
    courseCount: 2,
    explorationProgress: 28
  },
  {
    id: 'area-makati',
    code: 'makati',
    name: 'Makati / Ayala Triangle',
    city: 'Makati',
    description: 'Green urban paths, Sunday running culture, and business district energy.',
    theme: 'Green urban path',
    explorationVibe: 'Tree-lined paths, golden offices, and steady routes through a city garden.',
    worldZone: 'Golden Triangle Grove',
    mapCenter: [14.5566, 121.0234],
    courseCount: 1,
    explorationProgress: 18
  },
  {
    id: 'area-moa',
    code: 'moa',
    name: 'MOA / Pasay',
    city: 'Pasay',
    description: 'Seaside routes, open-air walking, and sunset-friendly paths.',
    theme: 'Seaside route',
    explorationVibe: 'Open skies, bay breeze, sunset walks, and long relaxed pathfinding.',
    worldZone: 'Bayfront Horizon',
    mapCenter: [14.5352, 120.9822],
    courseCount: 1,
    explorationProgress: 10
  }
];
