import { useEffect, useState } from 'react';
import {
  deleteAdminCourse,
  listAdminCoursePoints,
  listAdminCourses,
  replaceAdminCoursePoints,
  updateAdminCourseName,
  type AdminCourse
} from './adminService';

function parsePoints(value: string) {
  const parsed = JSON.parse(value) as Array<{ lat: number; lng: number }>;
  if (!Array.isArray(parsed)) {
    throw new Error('Route points must be an array.');
  }

  parsed.forEach((point) => {
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      throw new Error('Each point must include numeric lat and lng.');
    }
  });

  return parsed;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [pointsByCourse, setPointsByCourse] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Loading courses...');

  async function loadCourses() {
    try {
      const nextCourses = await listAdminCourses();
      const pointPairs = await Promise.all(
        nextCourses.map(async (course) => {
          const points = await listAdminCoursePoints(course.id);
          return [
            course.id,
            JSON.stringify(
              points.map((point) => ({ lat: point.lat, lng: point.lng })),
              null,
              2
            )
          ] as const;
        })
      );

      setCourses(nextCourses);
      setPointsByCourse(Object.fromEntries(pointPairs));
      setStatus('Course management connected to Supabase.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load courses.');
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Real Supabase courses</p>
        <h2 className="mt-1 text-2xl font-black">Courses</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {courses.map((course) => (
          <article key={course.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <input
                  defaultValue={course.name}
                  onBlur={(event) =>
                    void updateAdminCourseName(course.id, event.target.value).then(loadCourses)
                  }
                  className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 font-black text-stone-100"
                />
                <p className="mt-2 text-xs text-stone-500">
                  {course.area} · {course.distance.toFixed(2)} km · {course.difficulty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void deleteAdminCourse(course.id).then(loadCourses)}
                className="rounded-md border border-red-400/40 px-3 py-2 text-sm font-bold text-red-200"
              >
                Delete Course
              </button>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase text-stone-500">Route points JSON</span>
              <textarea
                value={pointsByCourse[course.id] ?? '[]'}
                onChange={(event) =>
                  setPointsByCourse((current) => ({ ...current, [course.id]: event.target.value }))
                }
                rows={6}
                className="mt-2 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-xs text-stone-100"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                try {
                  void replaceAdminCoursePoints(course.id, parsePoints(pointsByCourse[course.id] ?? '[]'))
                    .then(loadCourses)
                    .then(() => setStatus('Route points updated.'));
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : 'Invalid route points JSON.');
                }
              }}
              className="mt-3 rounded-md bg-amber-300 px-3 py-2 text-sm font-black text-stone-950"
            >
              Save Route Points
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
