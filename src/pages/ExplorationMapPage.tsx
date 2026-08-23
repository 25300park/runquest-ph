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
  const [loopCount, setLoopCount] = useState(1);
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
  const selectedBaseDistanceKm = selectedCourse?.distanceKm ?? 0;
  const selectedTotalDistanceKm = Number((selectedBaseDistanceKm * loopCount).toFixed(2));

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    const firstCourse = courses.find((course) => course.areaId === areaId);
    setSelectedCourseId(firstCourse?.id ?? null);
    setLoopCount(1);
  }

  function selectCourse(courseId: string) {
    const course = courses.find((item) => item.id === courseId);
    if (course) {
      setSelectedAreaId(course.areaId);
      setSelectedCourseId(course.id);
      setLoopCount(1);
    }
  }

  return (
    <section className="min-h-full bg-slate-50 text-slate-900 font-sans pb-8 select-none">
      <div className="space-y-3 px-4 py-4">
        {/* 상단 레벨 & 타이틀 카드 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
                Level {mockUser.level} · {mockUser.characterName}
              </p>
              <h1 className="mt-0.5 text-2xl font-black text-slate-900">Exploration Map</h1>
              <p className="mt-0.5 text-xs text-slate-500">{mockUser.totalXp} XP earned</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 border border-violet-200/60">
              Live Routes
            </span>
          </div>
        </div>

        {/* 지역 필터 버튼 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {mockAreas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => selectArea(area.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${
                area.id === selectedAreaId
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* 지도 컨테이너 & 반투명 플로팅 오버레이 */}
      <div className="relative h-[58vh] min-h-[460px] overflow-hidden border-y border-slate-200">
        {selectedCourse && previewUserPosition ? (
          <ExplorationMap
            areas={mockAreas}
            courses={courses}
            selectedCourse={selectedCourse}
            userPosition={previewUserPosition}
            onSelectCourse={selectCourse}
          />
        ) : (
          <div className="grid h-full place-items-center bg-slate-100 px-6 text-center">
            <div>
              <p className="text-xs font-black uppercase text-violet-600">
                {isLoadingCourses ? 'Loading routes' : 'No routes found'}
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-800">
                {isLoadingCourses ? 'Opening map...' : 'Create a course first'}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {courseLoadError ?? 'Saved courses from Course Builder will appear here.'}
              </p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 backdrop-blur-md shadow-md">
          <p className="text-[10px] font-black uppercase text-violet-600">{selectedArea.worldZone}</p>
          <p className="mt-0.5 text-xs font-black text-slate-800">{selectedArea.name}</p>
        </div>
      </div>

      {/* 하단 선택된 코스 상세 정보 카드 */}
      <div className="space-y-3 px-4 py-4">
        {selectedCourse && (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected route</p>
                <h2 className="mt-0.5 text-xl font-black text-slate-900">{selectedCourse.name}</h2>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
                {selectedCourse.difficulty}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{selectedCourse.description}</p>

            {/* 루프 설정 */}
            <div className="mt-3.5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Loop multiplier</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setLoopCount(count)}
                    className={`rounded-xl py-1.5 text-xs font-black transition-all ${
                      loopCount === count
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>

            {/* 스탯 3열 */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] text-slate-400 font-bold">Distance</p>
                <p className="font-black text-slate-800 text-xs mt-0.5">{selectedTotalDistanceKm} km</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] text-slate-400 font-bold">Reward</p>
                <p className="font-black text-amber-600 text-xs mt-0.5">+{selectedCourse.xpReward} XP</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] text-slate-400 font-bold">Explore</p>
                <p className="font-black text-teal-600 text-xs mt-0.5">+{selectedCourse.explorationReward}%</p>
              </div>
            </div>

            <Link
              to={`/courses/${selectedCourse.id}`}
              className="mt-4 block w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-center font-bold text-sm text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-all"
            >
              View Route Details
            </Link>
          </div>
        )}

        {/* 하단 지역 코스 목록 */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {areaCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => selectCourse(course.id)}
              className={`min-w-52 rounded-2xl p-3.5 text-left border transition-all ${
                course.id === selectedCourse?.id
                  ? 'border-violet-300 bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="font-black text-xs text-slate-900 truncate">{course.name}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {course.distanceKm} km • {course.estimatedTimeMin} min
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
