import { mockCourses } from '../data/mockCourses';

const topCreators = [
  { name: 'Mika Routes', area: 'BGC', shares: 128, courses: 7 },
  { name: 'Ayala Sunday Crew', area: 'Makati', shares: 96, courses: 5 },
  { name: 'Baywalk Scouts', area: 'MOA', shares: 74, courses: 4 }
];

export default function CourseViralHubPage() {
  const popularCourses = [...mockCourses].sort((first, second) => second.xpReward - first.xpReward);

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-sm font-black uppercase text-amber-200">Viral course system</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Shareable route foundation</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Mock sharing, popular course discovery, and creator ranking structure for future social growth.
        </p>
      </div>

      <div>
        <h2 className="font-black">Popular courses</h2>
        <div className="mt-3 grid gap-3">
          {popularCourses.slice(0, 4).map((course) => (
            <article key={course.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">{course.areaName}</p>
                  <h3 className="mt-1 text-xl font-black">{course.name}</h3>
                  <p className="mt-2 text-sm text-stone-400">{course.distanceKm} km · {course.difficulty}</p>
                </div>
                <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
                  {course.xpReward} XP
                </span>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-quest-teal px-4 py-3 font-black text-white"
              >
                Share Course
              </button>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-black">Top creators</h2>
        <div className="mt-3 grid gap-3">
          {topCreators.map((creator, index) => (
            <article key={creator.name} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-lg font-black text-amber-200">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-black">{creator.name}</h3>
                  <p className="text-sm text-stone-400">{creator.area}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-quest-teal">{creator.shares} shares</p>
                  <p className="text-xs text-stone-500">{creator.courses} courses</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
