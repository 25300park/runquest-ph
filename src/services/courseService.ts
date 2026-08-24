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

const CUSTOM_COURSES_KEY = 'runquest_custom_courses_v2';

function getLocalCustomCourses(): Record<string, CourseWithPoints> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_COURSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCustomCourse(course: CourseWithPoints) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalCustomCourses();
    current[course.id] = course;
    localStorage.setItem(CUSTOM_COURSES_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Could not write course to localStorage', err);
  }
}

async function getCoursePoints(courseId: string): Promise<CoursePointRow[]> {
  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('course_points')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('SUPABASE POINTS ERROR:', error);
      const local = getLocalCustomCourses()[courseId];
      return local?.course_points ?? [];
    }

    return data ?? [];
  } catch {
    const local = getLocalCustomCourses()[courseId];
    return local?.course_points ?? [];
  }
}

async function attachCoursePoints(courses: CourseRow[]): Promise<CourseWithPoints[]> {
  return Promise.all(
    courses.map(async (course) => {
      const local = getLocalCustomCourses()[course.id];
      const points = await getCoursePoints(course.id);
      // 로컬에 더 최신 수정본이 있으면 로컬 데이터 우선 병합
      if (local && local.course_points.length > 0) {
        return {
          ...course,
          name: local.name || course.name,
          distance: local.distance || course.distance,
          difficulty: local.difficulty || course.difficulty,
          course_points: local.course_points
        };
      }
      return {
        ...course,
        course_points: points
      };
    })
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
  const generatedId = `course-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
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

    if (!error && data?.id) {
      return data.id;
    }
  } catch (err) {
    console.warn('Supabase createCourse offline/error, using local generated ID:', err);
  }

  return generatedId;
}

export async function saveCoursePoints(courseId: string, points: CoursePointInput[]) {
  try {
    const client = requireSupabaseClient();
    await client.from('course_points').insert(
      points.map((point) => ({
        course_id: courseId,
        lat: point.lat,
        lng: point.lng,
        order_index: point.orderIndex,
        type: point.type
      }))
    );
  } catch (error) {
    console.warn('Supabase saveCoursePoints failed (offline/RLS):', error);
  }
}

export async function replaceCoursePoints(courseId: string, points: CoursePointInput[]) {
  try {
    const client = requireSupabaseClient();
    await client.from('course_points').delete().eq('course_id', courseId);
    await saveCoursePoints(courseId, points);
  } catch (deleteError) {
    console.warn('Supabase replaceCoursePoints failed (offline/RLS):', deleteError);
  }
}

export async function getCoursesByArea(area: CourseArea) {
  const allCourses = await getCourses();
  return allCourses.filter((c) => c.area === area);
}

export async function getCourses(): Promise<CourseWithPoints[]> {
  const localMap = getLocalCustomCourses();
  let supabaseCourses: CourseRow[] = [];

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      supabaseCourses = data;
    }
  } catch (err) {
    console.warn('Supabase getCourses offline/fallback:', err);
  }

  const attached = await attachCoursePoints(supabaseCourses);
  const attachedIds = new Set(attached.map((c) => c.id));

  // 로컬에만 있는 코스들도 함께 포함
  const result = [...attached];
  for (const [id, localCourse] of Object.entries(localMap)) {
    if (!attachedIds.has(id)) {
      result.unshift(localCourse);
    }
  }

  return result;
}

export async function getCourseById(courseId: string): Promise<CourseWithPoints | null> {
  const local = getLocalCustomCourses()[courseId];

  try {
    const client = requireSupabaseClient();
    const { data: course, error: courseError } = await client
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (course && !courseError) {
      const points = await getCoursePoints(course.id);
      const mergedPoints =
        local && local.course_points.length > 0 ? local.course_points : points;

      const fullCourse: CourseWithPoints = {
        ...course,
        name: local?.name || course.name,
        distance: local?.distance || course.distance,
        difficulty: local?.difficulty || course.difficulty,
        course_points: mergedPoints
      };

      // 최신 상태 캐시 갱신
      saveLocalCustomCourse(fullCourse);
      return fullCourse;
    }
  } catch (err) {
    console.warn('Supabase getCourseById offline/fallback:', err);
  }

  if (local) {
    return local;
  }

  return null;
}

export async function updateCourse(input: UpdateCourseInput, routePoints: LatLngTuple[]) {
  const pointRows: CoursePointRow[] = routePoints.map((pt, idx) => ({
    id: `pt-${input.id}-${idx}`,
    course_id: input.id,
    lat: pt[0],
    lng: pt[1],
    order_index: idx,
    type: idx === 0 ? 'start' : idx === routePoints.length - 1 ? 'finish' : 'checkpoint'
  }));

  const localUpdatedCourse: CourseWithPoints = {
    id: input.id,
    name: input.name,
    area: input.area,
    difficulty: input.difficulty,
    distance: input.distance,
    created_at: new Date().toISOString(),
    created_by: null,
    course_points: pointRows
  };

  // 1. 로컬 스토리지에 100% 즉시 영구 저장
  saveLocalCustomCourse(localUpdatedCourse);

  // 2. Supabase DB에 비동기 반영
  try {
    const client = requireSupabaseClient();
    await client
      .from('courses')
      .update({
        name: input.name,
        area: input.area,
        difficulty: input.difficulty,
        distance: input.distance
      })
      .eq('id', input.id);

    await replaceCoursePoints(input.id, routePointsToCoursePointInputs(routePoints));
  } catch (err) {
    console.warn('Supabase updateCourse sync failed (offline/RLS), saved to local storage:', err);
  }

  return input.id;
}

export async function saveRouteAsCourse(input: CreateCourseInput, routePoints: LatLngTuple[]) {
  const courseId = await createCourse(input);
  const pointRows: CoursePointRow[] = routePoints.map((pt, idx) => ({
    id: `pt-${courseId}-${idx}`,
    course_id: courseId,
    lat: pt[0],
    lng: pt[1],
    order_index: idx,
    type: idx === 0 ? 'start' : idx === routePoints.length - 1 ? 'finish' : 'checkpoint'
  }));

  const localCourse: CourseWithPoints = {
    id: courseId,
    name: input.name,
    area: input.area,
    difficulty: input.difficulty,
    distance: input.distance,
    created_at: new Date().toISOString(),
    created_by: input.createdBy ?? null,
    course_points: pointRows
  };

  // 로컬 스토리지 저장
  saveLocalCustomCourse(localCourse);

  // Supabase 비동기 저장
  try {
    await saveCoursePoints(courseId, routePointsToCoursePointInputs(routePoints));
  } catch (err) {
    console.warn('Supabase saveRouteAsCourse points sync failed, saved locally:', err);
  }

  return courseId;
}
