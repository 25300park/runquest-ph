import { useEffect, useState } from 'react';
import {
  deleteInvalidCourse,
  listAdminCourses,
  updateCourseModeration,
  type AdminCourse
} from './adminService';

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [status, setStatus] = useState('Loading course queue...');

  async function loadCourses() {
    try {
      setCourses(await listAdminCourses());
      setStatus('Course moderation ready.');
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
        <p className="text-xs font-black uppercase text-amber-200">Map QA</p>
        <h2 className="mt-1 text-2xl font-black">Courses</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {courses.map((course) => (
          <article key={course.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{course.name}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {course.area} · {course.distance.toFixed(2)} km · {course.difficulty}
                </p>
              </div>
              <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-black uppercase text-amber-200">
                {course.status}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  void updateCourseModeration(course.id, {
                    status: 'approved',
                    verified: true
                  }).then(loadCourses)
                }
                className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-stone-950"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() =>
                  void updateCourseModeration(course.id, {
                    status: 'rejected',
                    verified: false
                  }).then(loadCourses)
                }
                className="rounded-md border border-red-400/40 px-3 py-2 text-sm font-bold text-red-200"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => void deleteInvalidCourse(course.id).then(loadCourses)}
                className="rounded-md border border-stone-700 px-3 py-2 text-sm font-bold"
              >
                Delete Invalid
              </button>
              <a
                href={`/admin/course-builder/${course.id}`}
                className="rounded-md border border-amber-200 px-3 py-2 text-center text-sm font-bold text-amber-200"
              >
                Edit GPX Route
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
