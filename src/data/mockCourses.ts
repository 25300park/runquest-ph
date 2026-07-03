import type { Course } from '../types/course';

export const mockCourses: Course[] = [
  {
    id: 'course-bgc-morning-loop',
    areaId: 'area-bgc',
    areaName: 'BGC',
    name: 'BGC Morning Loop',
    description: 'A beginner-friendly loop around Bonifacio High Street and nearby open streets.',
    courseType: 'beginner',
    distanceKm: 2.5,
    estimatedTimeMin: 30,
    difficulty: 'Easy',
    xpReward: 280,
    explorationReward: 5,
    startPoint: [14.5506, 121.0512],
    finishPoint: [14.5506, 121.0512],
    routeCoordinates: [
      [14.5506, 121.0512],
      [14.5514, 121.0524],
      [14.5525, 121.0515],
      [14.552, 121.0499],
      [14.5508, 121.0494],
      [14.5506, 121.0512]
    ],
    checkpoints: [
      {
        id: 'bgc-start',
        name: 'High Street Start',
        type: 'START',
        position: [14.5506, 121.0512],
        distanceFromStartKm: 0
      },
      {
        id: 'bgc-cp1',
        name: 'Track 30th',
        type: 'CHECKPOINT',
        position: [14.5525, 121.0515],
        distanceFromStartKm: 0.9
      },
      {
        id: 'bgc-finish',
        name: 'High Street Finish',
        type: 'FINISH',
        position: [14.5506, 121.0512],
        distanceFromStartKm: 2.5
      }
    ],
    pois: [
      {
        id: 'bgc-poi-water',
        name: 'Water stop candidate',
        type: 'drinking_water',
        position: [14.5514, 121.0524]
      }
    ],
    safetyNotes: 'Use pedestrian crossings and avoid peak vehicle traffic near intersections.'
  },
  {
    id: 'course-bgc-sunset-walk',
    areaId: 'area-bgc',
    areaName: 'BGC',
    name: 'BGC Sunset Walk',
    description: 'A light walking route for after-work exploration and relaxed pacing.',
    courseType: 'walking',
    distanceKm: 1.8,
    estimatedTimeMin: 25,
    difficulty: 'Easy',
    xpReward: 190,
    explorationReward: 4,
    startPoint: [14.5499, 121.0495],
    finishPoint: [14.552, 121.0521],
    routeCoordinates: [
      [14.5499, 121.0495],
      [14.5508, 121.0503],
      [14.5515, 121.0511],
      [14.552, 121.0521]
    ],
    checkpoints: [
      {
        id: 'sunset-start',
        name: 'Terra 28th Start',
        type: 'START',
        position: [14.5499, 121.0495],
        distanceFromStartKm: 0
      },
      {
        id: 'sunset-cp1',
        name: 'High Street Crossing',
        type: 'CHECKPOINT',
        position: [14.5508, 121.0503],
        distanceFromStartKm: 0.7
      },
      {
        id: 'sunset-finish',
        name: 'High Street Finish',
        type: 'FINISH',
        position: [14.552, 121.0521],
        distanceFromStartKm: 1.8
      }
    ],
    pois: [],
    safetyNotes: 'Stay on lit sidewalks and keep the route relaxed during busy evening hours.'
  },
  {
    id: 'course-makati-triangle-green',
    areaId: 'area-makati',
    areaName: 'Makati / Ayala Triangle',
    name: 'Ayala Triangle Green Route',
    description: 'A shaded city route around Ayala Triangle for easy jogging.',
    courseType: 'jogging',
    distanceKm: 2.2,
    estimatedTimeMin: 28,
    difficulty: 'Easy',
    xpReward: 240,
    explorationReward: 5,
    startPoint: [14.5566, 121.0234],
    finishPoint: [14.5566, 121.0234],
    routeCoordinates: [
      [14.5566, 121.0234],
      [14.5574, 121.0246],
      [14.5583, 121.0235],
      [14.5572, 121.0222],
      [14.5566, 121.0234]
    ],
    checkpoints: [
      {
        id: 'makati-start',
        name: 'Triangle Garden Start',
        type: 'START',
        position: [14.5566, 121.0234],
        distanceFromStartKm: 0
      },
      {
        id: 'makati-cp1',
        name: 'Ayala Avenue Edge',
        type: 'CHECKPOINT',
        position: [14.5574, 121.0246],
        distanceFromStartKm: 0.8
      },
      {
        id: 'makati-finish',
        name: 'Triangle Garden Finish',
        type: 'FINISH',
        position: [14.5566, 121.0234],
        distanceFromStartKm: 2.2
      }
    ],
    pois: [],
    safetyNotes: 'Watch for street crossings around the triangle perimeter.'
  },
  {
    id: 'course-moa-bay-walk',
    areaId: 'area-moa',
    areaName: 'MOA / Pasay',
    name: 'MOA Bay Walk',
    description: 'An open-air seaside route for walking, jogging, and sunset views.',
    courseType: 'walking',
    distanceKm: 3,
    estimatedTimeMin: 40,
    difficulty: 'Normal',
    xpReward: 360,
    explorationReward: 6,
    startPoint: [14.5352, 120.9822],
    finishPoint: [14.5328, 120.9796],
    routeCoordinates: [
      [14.5352, 120.9822],
      [14.5345, 120.9812],
      [14.5336, 120.9804],
      [14.5328, 120.9796]
    ],
    checkpoints: [
      {
        id: 'moa-start',
        name: 'MOA Bay Start',
        type: 'START',
        position: [14.5352, 120.9822],
        distanceFromStartKm: 0
      },
      {
        id: 'moa-cp1',
        name: 'Baywalk Midpoint',
        type: 'CHECKPOINT',
        position: [14.5345, 120.9812],
        distanceFromStartKm: 1.1
      },
      {
        id: 'moa-finish',
        name: 'Sunset Finish',
        type: 'FINISH',
        position: [14.5328, 120.9796],
        distanceFromStartKm: 3
      }
    ],
    pois: [],
    safetyNotes: 'Bring water and choose cooler hours when walking near the bay.'
  },
  {
    id: 'course-makati-ayala-avenue-run',
    areaId: 'area-makati',
    areaName: 'Makati / Ayala Triangle',
    name: 'Ayala Avenue Sunday Run',
    description: 'A real-like city route inspired by Sunday morning runs along Ayala Avenue.',
    courseType: 'running',
    distanceKm: 4.2,
    estimatedTimeMin: 42,
    difficulty: 'Normal',
    xpReward: 520,
    explorationReward: 7,
    startPoint: [14.5568, 121.0231],
    finishPoint: [14.5568, 121.0231],
    routeCoordinates: [
      [14.5568, 121.0231],
      [14.5559, 121.0206],
      [14.5549, 121.0181],
      [14.5539, 121.0157],
      [14.5552, 121.0184],
      [14.5568, 121.0231]
    ],
    checkpoints: [
      {
        id: 'ayala-run-start',
        name: 'Ayala Triangle Start',
        type: 'START',
        position: [14.5568, 121.0231],
        distanceFromStartKm: 0
      },
      {
        id: 'ayala-run-cp1',
        name: 'Ayala Avenue Turn',
        type: 'CHECKPOINT',
        position: [14.5549, 121.0181],
        distanceFromStartKm: 1.8
      },
      {
        id: 'ayala-run-finish',
        name: 'Ayala Triangle Finish',
        type: 'FINISH',
        position: [14.5568, 121.0231],
        distanceFromStartKm: 4.2
      }
    ],
    pois: [
      {
        id: 'ayala-run-poi-cafe',
        name: 'Post-run cafe area',
        type: 'cafe',
        position: [14.5562, 121.0221]
      }
    ],
    safetyNotes: 'Best for organized pedestrian-friendly hours. Use crossings and follow marshals.'
  }
];
