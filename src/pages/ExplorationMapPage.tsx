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
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null); // Step 1: null이면 '전체 보기'
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

        if (!isMounted) return;

        setCourses(mappedCourses);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load Supabase courses.';
        setCourseLoadError(message);
        setCourses([]);
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedArea = mockAreas.find((area) => area.id === selectedAreaId) ?? mockAreas[0];
  const areaCourses = useMemo(
    () => courses.filter((course) => course.areaId === selectedAreaId),
    [courses, selectedAreaId]
  );

  // Step 3: 지도에 렌더링할 코스 필터링
  const displayedCourses = useMemo(() => {
    if (selectedCourseId) {
      return areaCourses.filter((course) => course.id === selectedCourseId);
    }
    return areaCourses;
  }, [areaCourses, selectedCourseId]);

  // 화면 중심 및 디테일에 표시될 활성 코스
  const activeCourse = useMemo(() => {
    if (selectedCourseId) {
      return areaCourses.find((course) => course.id === selectedCourseId) ?? areaCourses[0];
    }
    return areaCourses[0];
  }, [areaCourses, selectedCourseId]);

  const previewUserPosition = activeCourse?.routeCoordinates[1] ?? activeCourse?.startPoint;
  const selectedBaseDistanceKm = activeCourse?.distanceKm ?? 0;
  const selectedTotalDistanceKm = Number((selectedBaseDistanceKm * loopCount).toFixed(2));

  // Step 1: 지역 변경 시 코스 선택 초기화 (전체 보기로 복귀)
  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
    setSelectedCourseId(null);
    setLoopCount(1);
  }

  function selectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setLoopCount(1);
  }

  return (
    <section className="min-h-full bg-slate-50 text-slate-900 font-sans pb-8 select-none">
      <div className="space-y-2.5 px-4 py-4">
        {/* 1. 상단 레벨 & 타이틀 카드 */}
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

        {/* 2. 지역 선택 탭 (BGC, Makati, MOA) */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
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

        {/* 3. 코스 필터링 칩(Chips/Pills) 목록 (Step 2) */}
        {areaCourses.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-200/60">
            {/* 전체 보기 칩 */}
            <button
              type="button"
              onClick={() => setSelectedCourseId(null)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedCourseId === null
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🌐</span>
              <span>All Courses ({areaCourses.length})</span>
            </button>

            {/* 개별 코스 칩들 */}
            {areaCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => selectCourse(course.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCourseId === course.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📍</span>
                <span className="max-w-[140px] truncate">{course.name}</span>
                <span className={`text-[10px] ${selectedCourseId === course.id ? 'text-violet-200' : 'text-slate-400'}`}>
                  {course.distanceKm}km
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. 지도 컨테이너 & 반투명 플로팅 오버레이 (Step 3: 필터링된 코스 렌더링) */}
      <div className="relative h-[55vh] min-h-[440px] overflow-hidden border-y border-slate-200">
        {displayedCourses.length > 0 && activeCourse && previewUserPosition ? (
          <ExplorationMap
            areas={mockAreas}
            courses={displayedCourses}
            selectedCourse={activeCourse}
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
          <p className="mt-0.5 text-xs font-black text-slate-800">
            {selectedCourseId ? activeCourse?.name : selectedArea.name}
          </p>
        </div>
      </div>

      {/* 5. 하단 선택된 코스 상세 정보 카드 */}
      <div className="space-y-3 px-4 py-4">
        {activeCourse && (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {selectedCourseId ? 'Selected Route' : 'Featured Route'}
                </p>
                <h2 className="mt-0.5 text-xl font-black text-slate-900">{activeCourse.name}</h2>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
                {activeCourse.difficulty}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{activeCourse.description}</p>

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
                <p className="font-black text-amber-600 text-xs mt-0.5">+{activeCourse.xpReward} XP</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] text-slate-400 font-bold">Explore</p>
                <p className="font-black text-teal-600 text-xs mt-0.5">+{activeCourse.explorationReward}%</p>
              </div>
            </div>

            <Link
              to={`/courses/${activeCourse.id}`}
              className="mt-4 block w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-center font-bold text-sm text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-all"
            >
              View Route Details
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
