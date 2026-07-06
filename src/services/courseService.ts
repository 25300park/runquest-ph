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

export type UpdateCourseInput = {
  id: string;
  name: string;
  area: CourseArea;
  difficulty: CourseDifficulty;
  distance: number;
};

export type CoursePointInput = {
  lat: number;
  lng: number;
  orderIndex: number;
  type: 'start' | 'checkpoint' | 'finish';
};

export type CoursePointRow = Database['public']['Tables']['course_points']['Row'];
export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type CourseWithPoints = CourseRow & {
  course_points: CoursePointRow[];
};

async function getCoursePoints(courseId: string): Promise<CoursePointRow[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('course_points')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  console.log('COURSE POINTS:', {
    courseId,
    points: data ?? []
  });

  if (error) {
    console.log('SUPABASE ERROR:', error);
    throw error;
  }

  return data ?? [];
}

async function attachCoursePoints(courses: CourseRow[]): Promise<CourseWithPoints[]> {
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      course_points: await getCoursePoints(course.id)
    }))
  );
}

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

export async function replaceCoursePoints(courseId: string, points: CoursePointInput[]) {
  const client = requireSupabaseClient();
  const { error: deleteError } = await client
    .from('course_points')
    .delete()
    .eq('course_id', courseId);

  if (deleteError) {
    throw deleteError;
  }

  await saveCoursePoints(courseId, points);
}

export async function getCoursesByArea(area: CourseArea) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('area', area)
    .order('created_at', { ascending: false });

  console.log('COURSES:', data ?? []);

  if (error) {
    console.log('SUPABASE ERROR:', error);
    throw error;
  }

  return attachCoursePoints(data ?? []);
}

export async function getCourses(): Promise<CourseWithPoints[]> {
  const client = requireSupabaseClient();
  console.log('FETCHING COURSES FROM SUPABASE');

  const { data, error } = await client
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('COURSES:', data ?? []);

  if (error) {
    console.log('SUPABASE ERROR:', error);
    throw error;
  }

  const courses = await attachCoursePoints(data ?? []);

  console.log('FETCHED COURSES', courses);
  console.log(
    'COURSE POINTS LOADED',
    courses.map((course) => ({
      id: course.id,
      name: course.name,
      points: course.course_points.length
    }))
  );

  return courses;
}

export async function getCourseById(courseId: string): Promise<CourseWithPoints | null> {
  const client = requireSupabaseClient();
  console.log('ROUTE ID:', courseId);

  const { data: course, error: courseError } = await client
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  console.log('COURSE:', course);

  if (courseError) {
    console.log('SUPABASE ERROR:', courseError);
    throw courseError;
  }

  if (!course) {
    return null;
  }

  const points = await getCoursePoints(course.id);
  console.log('POINTS:', points);

  return {
    ...course,
    course_points: points
  };
}

export async function updateCourse(input: UpdateCourseInput, routePoints: LatLngTuple[]) {
  const client = requireSupabaseClient();
  const { error } = await client
    .from('courses')
    .update({
      name: input.name,
      area: input.area,
      difficulty: input.difficulty,
      distance: input.distance
    })
    .eq('id', input.id);

  if (error) {
    throw error;
  }

  await replaceCoursePoints(input.id, routePointsToCoursePointInputs(routePoints));

  return input.id;
}

export async function saveRouteAsCourse(input: CreateCourseInput, routePoints: LatLngTuple[]) {
  const courseId = await createCourse(input);
  await saveCoursePoints(courseId, routePointsToCoursePointInputs(routePoints));

  return courseId;
}
