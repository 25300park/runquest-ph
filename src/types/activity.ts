export type ActivityState = 'idle' | 'running' | 'paused' | 'completed';

export type TrackingMode = 'gps' | 'mock';

export type ActivitySummary = {
  id: string;
  courseId: string;
  activityType: 'walking' | 'jogging' | 'running';
  distanceKm: number;
  durationSeconds: number;
  averagePaceSecondsPerKm: number;
  xpEarned: number;
  completionStatus: 'started' | 'completed' | 'abandoned';
};

export type CompletedActivitySummary = {
  activityId: string;
  courseId: string;
  distanceKm: number;
  durationSeconds: number;
};
