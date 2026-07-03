import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExplorationMap from '../components/map/ExplorationMap';
import { mockAreas } from '../data/mockAreas';
import { mockUser } from '../data/mockUser';
import { getCourses, type CourseWithPoints } from '../services/courseService';
import type { LatLngTuple } from '../types/area';
import type { Course, CourseCheckpoint, Difficulty } from '../types/course';

const areaIdByName: Record<CourseWithPoints['area'], string> = {
  BGC: 'area-bgc',
  Makati: 'area-makati',
  MOA: 'area-moa'
};

const areaNameByArea: Record<CourseWithPoints['area'], string> = {
  BGC: 'BGC',
  Makati: 'Makati / Ayala Triangle',
  MOA: 'MOA / Pasay'
};

function toCheckpointType(type: CourseWithPoints['course_points'][number]['type']) {
  if (type === 'start') {
    return 'START';
  }

  if (type === 'finish') {
    return 'FINISH';
  }

  return 'CHECKPOINT';
}

function estimateTimeMinutes(distanceKm: number, difficulty: Difficulty) {
  const paceByDifficulty: Record<Difficulty, number> = {
    Easy: 11,
    Normal: 9,
    Hard: 8,
    Challenge: 7
  };

  return Math.max(5, Math.round(distanceKm * paceByDifficulty[difficulty]));
}

function toMapCourse(course: CourseWithPoints): Course | null {
  const routeCoordinates = course.course_points.map(
    (point) => [point.lat, point.lng] as LatLngTuple
  );

  if (routeCoordinates.length < 2) {
    console.warn('COURSE SKIPPED: NOT ENOUGH COURSE POINTS', {
      id: course.id,
      name: course.name,
      points: routeCoordinates.length
    });
    return null;
  }

  const distanceKm = Number(course.distance.toFixed(2));
  const checkpoints: CourseCheckpoint[] = course.course_points.map((point, index) => ({
    id: point.id,
    name:
      point.type === 'start'
        ? 'Start Gate'
        : point.type === 'finish'
          ? 'Finish Gate'
          : `Checkpoint ${index}`,
    type: toCheckpointType(point.type),
    position: [point.lat, point.lng],
    distanceFromStartKm:
      routeCoordinates.length > 1
        ? Number(((distanceKm / (routeCoordinates.length - 1)) * index).toFixed(2))
        : 0
  }));

  return {
    id: course.id,
    areaId: areaIdByName[course.area],
    areaName: areaNameByArea[course.area],
    name: course.name,
    description: `A community-created ${course.area} route loaded from Supabase.`,
    courseType: 'city',
    distanceKm,
    estimatedTimeMin: estimateTimeMinutes(distanceKm, course.difficulty),
    difficulty: course.difficulty,
    xpReward: Math.round(distanceKm * 100),
    explorationReward: Math.max(3, Math.round(distanceKm * 5)),
    startPoint: routeCoordinates[0],
    finishPoint: routeCoordinates[routeCoordinates.length - 1],
    routeCoordinates,
    checkpoints,
    pois: [],
    safetyNotes: 'Review the route before running and stay aware of local traffic conditions.'
  };
}

export default function ExplorationMapPage() {
  const [selectedAreaId, setSelectedAreaId] = useState(mockAreas[0].id);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        setIsLoadingCourses(true);
        setCourseLoadError(null);

        const supabaseCourses = await getCourses();
        const mappedCourses = supabaseCourses
          .map(toMapCourse)
          .filter((course): course is Course => Boolean(course));

        if (!isMounted) {
          return;
        }

        setCourses(mappedCourses);
        setSelectedCourseId((currentCourseId) => {
          const currentCourseStillExists = mappedCourses.some(
            (course) => course.id === currentCourseId
          );

          return currentCourseStillExists ? currentCourseId : mappedCourses[0]?.id ?? null;
        });
        console.log('MAP UPDATED FROM SUPABASE', {
          renderedCourses: mappedCourses.length,
          courseIds: mappedCourses.map((course) => course.id)
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load Supabase courses.';
        console.error('FETCHED COURSES', error);
        setCourseLoadError(message);
        setCourses([]);
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );
  const selectedArea = mockAreas.find((area) => area.id === selectedAreaId) ?? mockAreas[0];
  const areaCourses = courses.filter((course) => course.areaId === selectedAreaId);
  const previewUserPosition = selectedCourse?.routeCoordinates[1] ?? selectedCourse?.startPoint;

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    const firstCourse = courses.find((course) => course.areaId === areaId);
    setSelectedCourseId(firstCourse?.id ?? null);
  }

  function selectCourse(courseId: string) {
    const course = courses.find((item) => item.id === courseId);
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
              Supabase Routes
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
        {selectedCourse && previewUserPosition ? (
          <ExplorationMap
            areas={mockAreas}
            courses={courses}
            selectedCourse={selectedCourse}
            userPosition={previewUserPosition}
            onSelectCourse={selectCourse}
          />
        ) : (
          <div className="grid h-full min-h-[500px] place-items-center bg-stone-950 px-6 text-center">
            <div>
              <p className="text-xs font-black uppercase text-amber-200">
                {isLoadingCourses ? 'Loading Supabase routes' : 'No database routes found'}
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {isLoadingCourses ? 'Opening the map...' : 'Create or import a course first'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                {courseLoadError ??
                  'Courses saved through the Course Builder will appear here once they have route points.'}
              </p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 backdrop-blur">
          <p className="text-xs font-black uppercase text-quest-teal">{selectedArea.worldZone}</p>
          <p className="mt-1 text-sm font-black text-stone-50">{selectedArea.name}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {selectedCourse ? (
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
        ) : null}

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
