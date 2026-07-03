import { requireSupabaseClient } from '../lib/supabase';
import type { LatLngTuple } from '../types/area';
import type { Database } from '../types/database';

export type CourseArea = Database['public']['Tables']['courses']['Insert']['area'];
export type CourseDifficulty = Database['public']['Tables']['courses']['Insert']['difficulty'];

export type CreateCourseInput = {
  name: string;
  area: CourseArea;
  difficulty: CourseDifficulty;
  distance: number;
  createdBy?: string | null;
};

export type CoursePointInput = {
  lat: number;
  lng: number;
  orderIndex: number;
  type: 'start' | 'checkpoint' | 'finish';
};

function toCoursePointInput(point: LatLngTuple, index: number, total: number): CoursePointInput {
  return {
    lat: point[0],
    lng: point[1],
    orderIndex: index,
    type: index === 0 ? 'start' : index === total - 1 ? 'finish' : 'checkpoint'
  };
}

export function routePointsToCoursePointInputs(routePoints: LatLngTuple[]) {
  return routePoints.map((point, index) => toCoursePointInput(point, index, routePoints.length));
}

export async function createCourse(input: CreateCourseInput) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .insert({
      name: input.name,
      area: input.area,
      difficulty: input.difficulty,
      distance: input.distance,
      created_by: input.createdBy ?? null
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function saveCoursePoints(courseId: string, points: CoursePointInput[]) {
  const client = requireSupabaseClient();
  const { error } = await client.from('course_points').insert(
    points.map((point) => ({
      course_id: courseId,
      lat: point.lat,
      lng: point.lng,
      order_index: point.orderIndex,
      type: point.type
    }))
  );

  if (error) {
    throw error;
  }
}

export async function getCoursesByArea(area: CourseArea) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .select('*, course_points(*)')
    .eq('area', area)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function saveRouteAsCourse(input: CreateCourseInput, routePoints: LatLngTuple[]) {
  const courseId = await createCourse(input);
  await saveCoursePoints(courseId, routePointsToCoursePointInputs(routePoints));

  return courseId;
}
