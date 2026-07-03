import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExplorationMap from '../components/map/ExplorationMap';
import { mockAreas } from '../data/mockAreas';
import { mockCourses } from '../data/mockCourses';
import { mockUser } from '../data/mockUser';

export default function ExplorationMapPage() {
  const [selectedAreaId, setSelectedAreaId] = useState(mockAreas[0].id);
  const [selectedCourseId, setSelectedCourseId] = useState(mockCourses[0].id);
  const selectedCourse = useMemo(
    () => mockCourses.find((course) => course.id === selectedCourseId) ?? mockCourses[0],
    [selectedCourseId]
  );
  const selectedArea = mockAreas.find((area) => area.id === selectedAreaId) ?? mockAreas[0];
  const areaCourses = mockCourses.filter((course) => course.areaId === selectedAreaId);
  const mockUserPosition = selectedCourse.routeCoordinates[1] ?? selectedCourse.startPoint;

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    const firstCourse = mockCourses.find((course) => course.areaId === areaId);
    if (firstCourse) {
      setSelectedCourseId(firstCourse.id);
    }
  }

  function selectCourse(courseId: string) {
    const course = mockCourses.find((item) => item.id === courseId);
    if (course) {
      setSelectedAreaId(course.areaId);
      setSelectedCourseId(course.id);
    }
  }

  return (
    <section className="min-h-full bg-[#111816] text-stone-50">
      <div className="space-y-3 px-4 py-4">
        <div className="rounded-2xl border border-stone-700 bg-stone-900/95 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-amber-200">
                Level {mockUser.level} · {mockUser.characterName}
              </p>
              <h1 className="mt-1 text-2xl font-black">Exploration Map</h1>
              <p className="mt-1 text-sm text-stone-400">{mockUser.totalXp} XP earned</p>
            </div>
            <span className="rounded-full bg-teal-950 px-3 py-2 text-xs font-black text-quest-teal">
              Mock GPS
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {mockAreas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => selectArea(area.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black ${
                area.id === selectedAreaId
                  ? 'border-amber-200 bg-amber-300 text-stone-950'
                  : 'border-stone-700 bg-stone-900 text-stone-300'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[62vh] min-h-[500px] overflow-hidden border-y border-stone-700">
        <ExplorationMap
          areas={mockAreas}
          courses={mockCourses}
          selectedCourse={selectedCourse}
          userPosition={mockUserPosition}
          onSelectCourse={selectCourse}
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 backdrop-blur">
          <p className="text-xs font-black uppercase text-quest-teal">{selectedArea.worldZone}</p>
          <p className="mt-1 text-sm font-black text-stone-50">{selectedArea.name}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-amber-200">Selected route</p>
              <h2 className="mt-1 text-2xl font-black text-stone-50">{selectedCourse.name}</h2>
            </div>
            <span className="rounded-full bg-teal-950 px-3 py-1 text-xs font-black text-quest-teal">
              {selectedCourse.difficulty}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-300">{selectedCourse.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-stone-950 p-3">
              <p className="text-xs text-stone-500">Distance</p>
              <p className="font-black">{selectedCourse.distanceKm} km</p>
            </div>
            <div className="rounded-xl bg-stone-950 p-3">
              <p className="text-xs text-stone-500">Reward</p>
              <p className="font-black">{selectedCourse.xpReward} XP</p>
            </div>
            <div className="rounded-xl bg-stone-950 p-3">
              <p className="text-xs text-stone-500">Explore</p>
              <p className="font-black">+{selectedCourse.explorationReward}%</p>
            </div>
          </div>
          <Link
            to={`/courses/${selectedCourse.id}`}
            className="mt-4 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-3 text-center font-black text-stone-950"
          >
            View Route Details
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {areaCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => selectCourse(course.id)}
              className={`min-w-56 rounded-2xl border p-3 text-left ${
                course.id === selectedCourse.id
                  ? 'border-amber-200 bg-amber-200 text-stone-950'
                  : 'border-stone-700 bg-stone-900 text-stone-300'
              }`}
            >
              <p className="font-black">{course.name}</p>
              <p className="mt-1 text-sm opacity-80">
                {course.distanceKm} km · {course.estimatedTimeMin} min
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
