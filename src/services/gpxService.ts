import { gpx } from 'togeojson';
import type { LatLngTuple } from '../types/area';
import type { Difficulty } from '../types/course';
import {
  calculateRouteDistanceKm,
  estimatePaceLabel,
  estimateRouteDifficulty
} from '../utils/route';
import {
  type CourseArea,
  saveRouteAsCourse,
  routePointsToCoursePointInputs
} from './courseService';

export type ParsedGPXData = {
  name: string;
  coordinates: LatLngTuple[];
};

export type StructuredCourseFromGPX = {
  name: string;
  area: CourseArea;
  difficulty: Difficulty;
  distance: number;
  paceEstimate: string;
  xpReward: number;
  routePoints: LatLngTuple[];
  points: ReturnType<typeof routePointsToCoursePointInputs>;
};

function extractCoordinates(featureCollection: GeoJSON.FeatureCollection): LatLngTuple[] {
  const routeCoordinates: LatLngTuple[] = [];

  featureCollection.features.forEach((feature) => {
    if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach(([lng, lat]) => {
        routeCoordinates.push([lat, lng]);
      });
    }

    if (feature.geometry.type === 'MultiLineString') {
      feature.geometry.coordinates.flat().forEach(([lng, lat]) => {
        routeCoordinates.push([lat, lng]);
      });
    }
  });

  return routeCoordinates;
}

export async function parseGPX(file: File): Promise<ParsedGPXData> {
  const gpxText = await file.text();
  const gpxDocument = new DOMParser().parseFromString(gpxText, 'application/xml');
  const featureCollection = gpx(gpxDocument);
  const coordinates = extractCoordinates(featureCollection);

  return {
    name: file.name.replace(/\.gpx$/i, '').replace(/[-_]/g, ' ') || 'Imported GPX Course',
    coordinates
  };
}

export function convertToCourseFormat(gpxData: ParsedGPXData, area: CourseArea) {
  const distance = calculateRouteDistanceKm(gpxData.coordinates);
  const difficulty = estimateRouteDifficulty(distance);

  return {
    name: gpxData.name,
    area,
    difficulty,
    distance,
    paceEstimate: estimatePaceLabel(distance),
    xpReward: Math.round(distance * 100),
    routePoints: gpxData.coordinates,
    points: routePointsToCoursePointInputs(gpxData.coordinates)
  } satisfies StructuredCourseFromGPX;
}

export async function saveGPXAsCourse(file: File, area: CourseArea, createdBy?: string | null) {
  const parsedGPX = await parseGPX(file);
  const course = convertToCourseFormat(parsedGPX, area);
  const courseId = await saveRouteAsCourse(
    {
      name: course.name,
      area: course.area,
      difficulty: course.difficulty,
      distance: course.distance,
      createdBy
    },
    course.routePoints
  );

  return {
    courseId,
    course
  };
}
