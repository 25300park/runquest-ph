export type LatLngTuple = [number, number];

export type Area = {
  id: string;
  code: string;
  name: string;
  city: string;
  description: string;
  theme: string;
  explorationVibe: string;
  worldZone: string;
  mapCenter: LatLngTuple;
  courseCount: number;
  explorationProgress: number;
};
