import type { LatLngTuple } from '../types/area';
import {
  createCourse,
  getCoursesByArea,
  routePointsToCoursePointInputs,
  saveCoursePoints,
  saveRouteAsCourse
} from './courseService';
import { calculateRouteDistanceKm } from '../utils/route';

const samplePoints: LatLngTuple[] = [
  [14.5506, 121.0512],
  [14.5514, 121.0524],
  [14.5525, 121.0515]
];

export async function testInsertCourse() {
  try {
    const courseId = await createCourse({
      name: `Supabase Test Course ${new Date().toLocaleTimeString()}`,
      area: 'BGC',
      difficulty: 'Easy',
      distance: 2.5
    });

    const result = {
      id: courseId,
      name: 'Supabase Test Course',
      area: 'BGC',
      difficulty: 'Easy',
      distance: 2.5
    };

    console.log('INSERT RESULT: success', result);
    return result;
  } catch (error) {
    console.warn('INSERT RESULT: failure', error);
    throw error;
  }
}

export async function testFetchCourses() {
  try {
    const [bgcCourses, makatiCourses, moaCourses] = await Promise.all([
      getCoursesByArea('BGC'),
      getCoursesByArea('Makati'),
      getCoursesByArea('MOA')
    ]);
    const result = [...bgcCourses, ...makatiCourses, ...moaCourses].sort((firstCourse, secondCourse) =>
      String(secondCourse.created_at).localeCompare(String(firstCourse.created_at))
    );

    console.log('FETCH RESULT: success', result);
    return result;
  } catch (error) {
    console.warn('FETCH RESULT: failure', error);
    throw error;
  }
}

export async function testSaveGPXCourse(points: LatLngTuple[] = samplePoints) {
  try {
    const routePoints = points.length >= 2 ? points : samplePoints;
    const courseId = await saveRouteAsCourse(
      {
        name: `GPX Save Test ${new Date().toLocaleTimeString()}`,
        area: 'BGC',
        difficulty: 'Normal',
        distance: calculateRouteDistanceKm(routePoints)
      },
      routePoints
    );
    const mappedPoints = routePointsToCoursePointInputs(routePoints);
    const result = {
      courseId,
      points: mappedPoints
    };

    console.log('GPX SAVE RESULT: success', result);
    return result;
  } catch (error) {
    console.warn('GPX SAVE RESULT: failure', error);
    throw error;
  }
}

export async function testSaveCoursePoints(courseId: string, points: LatLngTuple[]) {
  const mappedPoints = routePointsToCoursePointInputs(points);
  await saveCoursePoints(courseId, mappedPoints);
  return mappedPoints;
}
