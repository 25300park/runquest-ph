import type { LatLngTuple } from './area';

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Challenge';

export type CheckpointType =
  | 'START'
  | 'CHECKPOINT'
  | 'REST'
  | 'VIEW'
  | 'VIEW_SPOT'
  | 'WATER'
  | 'TOILET'
  | 'CAFE'
  | 'CAUTION'
  | 'FINISH';

export type CourseCheckpoint = {
  id: string;
  name: string;
  type: CheckpointType;
  position: LatLngTuple;
  distanceFromStartKm: number;
};

export type CoursePoi = {
  id: string;
  name: string;
  type: string;
  position: LatLngTuple;
};

export type CourseDraftStatus = 'draft' | 'published';

export type CourseDraftPoiType = 'Cafe' | 'Toilet' | 'Water' | 'Viewpoint';

export type CourseDraftPoi = {
  id: string;
  name: string;
  type: CourseDraftPoiType;
  position: LatLngTuple;
};

export type CourseDraft = {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
  difficulty: Difficulty;
  xpReward: number;
  status: CourseDraftStatus;
  routeCoordinates: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  pois: CourseDraftPoi[];
  createdAt: string;
};

export type Course = {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  description: string;
  courseType: 'walking' | 'jogging' | 'running' | 'beginner' | 'city';
  distanceKm: number;
  estimatedTimeMin: number;
  difficulty: Difficulty;
  xpReward: number;
  explorationReward: number;
  startPoint: LatLngTuple;
  finishPoint: LatLngTuple;
  routeCoordinates: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  pois: CoursePoi[];
  safetyNotes: string;
};
