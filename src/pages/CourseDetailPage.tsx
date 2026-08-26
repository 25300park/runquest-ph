import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { getCourseById, type CourseWithPoints } from '../services/courseService';
import type { LatLngTuple } from '../types/area';
import type { Course, CourseCheckpoint } from '../types/course';

const areaNameByArea: Record<CourseWithPoints['area'], string> = {
  BGC: 'BGC (Bonifacio Global City)',
  Makati: 'Makati / Ayala Triangle',
  MOA: 'MOA / Pasay Seaside'
};

const areaIdByArea: Record<CourseWithPoints['area'], string> = {
  BGC: 'area-bgc',
  Makati: 'area-makati',
  MOA: 'area-moa'
};

function estimateTimeMinutes(distanceKm: number) {
  return Math.max(5, Math.round(distanceKm * 9));
}

function createLoopedRoute(routeCoordinates: LatLngTuple[], loopCount: number) {
  if (loopCount <= 1) {
    return routeCoordinates;
  }

  return Array.from({ length: loopCount }).flatMap((_, loopIndex) =>
    loopIndex === 0 ? routeCoordinates : routeCoordinates.slice(1)
  );
}

function createPointIcon(label: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="height:30px;width:30px;border-radius:9999px;border:2.5px solid white;background:${color};display:grid;place-items:center;color:white;font-weight:900;font-size:10px;box-shadow:0 8px 20px rgba(0,0,0,.25);">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithPoints | null>(null);
  const [loopCount, setLoopCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      if (!courseId) {
        setErrorMessage('Route ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextCourse = await getCourseById(courseId);

        if (!isMounted) return;
        setCourse(nextCourse);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load route details.';
        setErrorMessage(message);
        setCourse(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const routeCoordinates = useMemo(
    () =>
      course?.course_points.map((point) => [point.lat, point.lng] as LatLngTuple) ?? [],
    [course]
  );
  const startPoint = routeCoordinates[0];
  const baseDistanceKm = course ? Number(course.distance.toFixed(2)) : 0;
  const totalDistanceKm = Number((baseDistanceKm * loopCount).toFixed(2));
  const loopedRouteCoordinates = useMemo(
    () => createLoopedRoute(routeCoordinates, loopCount),
    [loopCount, routeCoordinates]
  );
  const xpReward = Math.round(totalDistanceKm * 100);
  const explorationReward = Math.max(3, Math.round(totalDistanceKm * 5));

  const activityCourse = useMemo<Course | null>(() => {
    if (!course || loopedRouteCoordinates.length < 2) return null;

    const baseCheckpoints: CourseCheckpoint[] = course.course_points.map((point, index) => ({
      id: point.id,
      name:
        point.type === 'start'
          ? 'Start Gate'
          : point.type === 'finish'
            ? 'Finish Gate'
            : `Checkpoint ${index}`,
      type:
        point.type === 'start' ? 'START' : point.type === 'finish' ? 'FINISH' : 'CHECKPOINT',
      position: [point.lat, point.lng],
      distanceFromStartKm:
        routeCoordinates.length > 1
          ? Number(((baseDistanceKm / (routeCoordinates.length - 1)) * index).toFixed(2))
          : 0
    }));

    return {
      id: course.id,
      areaId: areaIdByArea[course.area],
      areaName: areaNameByArea[course.area],
      name: course.name,
      description: `A community-created ${course.area} route loaded from Supabase.`,
      courseType: 'city',
      distanceKm: totalDistanceKm,
      estimatedTimeMin: estimateTimeMinutes(totalDistanceKm),
      difficulty: course.difficulty,
      xpReward,
      explorationReward,
      startPoint: loopedRouteCoordinates[0],
      finishPoint: loopedRouteCoordinates[loopedRouteCoordinates.length - 1],
      routeCoordinates: loopedRouteCoordinates,
      checkpoints: baseCheckpoints,
      pois: [],
      safetyNotes: 'Review the route before running and stay aware of local traffic conditions.'
    };
  }, [
    baseDistanceKm,
    course,
    explorationReward,
    loopedRouteCoordinates,
    routeCoordinates,
    totalDistanceKm,
    xpReward
  ]);

  const baseActivityCourse = useMemo<Course | null>(() => {
    if (!course || routeCoordinates.length < 2) return null;

    const baseCheckpoints: CourseCheckpoint[] = course.course_points.map((point, index) => ({
      id: point.id,
      name:
        point.type === 'start'
          ? 'Start Gate'
          : point.type === 'finish'
            ? 'Finish Gate'
            : `Checkpoint ${index}`,
      type:
        point.type === 'start' ? 'START' : point.type === 'finish' ? 'FINISH' : 'CHECKPOINT',
      position: [point.lat, point.lng],
      distanceFromStartKm:
        routeCoordinates.length > 1
          ? Number(((baseDistanceKm / (routeCoordinates.length - 1)) * index).toFixed(2))
          : 0
    }));

    return {
      id: course.id,
      areaId: areaIdByArea[course.area],
      areaName: areaNameByArea[course.area],
      name: course.name,
      description: `A community-created ${course.area} route loaded from Supabase.`,
      courseType: 'city',
      distanceKm: baseDistanceKm,
      estimatedTimeMin: estimateTimeMinutes(baseDistanceKm),
      difficulty: course.difficulty,
      xpReward: Math.round(baseDistanceKm * 100),
      explorationReward: Math.max(3, Math.round(baseDistanceKm * 5)),
      startPoint: routeCoordinates[0],
      finishPoint: routeCoordinates[routeCoordinates.length - 1],
      routeCoordinates,
      checkpoints: baseCheckpoints,
      pois: [],
      safetyNotes: 'Review the route before running and stay aware of local traffic conditions.'
    };
  }, [baseDistanceKm, course, routeCoordinates]);

  function startCourse() {
    if (!activityCourse) {
      navigate('/map');
      return;
    }

    navigate('/run', {
      state: {
        course: activityCourse,
        baseCourse: baseActivityCourse ?? activityCourse,
        loopCount,
        totalDistance: totalDistanceKm
      }
    });
  }

  // 하단 중앙 네비게이션 버튼(⚔️) 클릭 시 즉시 현재 코스로 퀘스트 시작
  useEffect(() => {
    const handleStartEvent = () => {
      startCourse();
    };

    window.addEventListener('runquest:start-current-course', handleStartEvent);
    return () => {
      window.removeEventListener('runquest:start-current-course', handleStartEvent);
    };
  });

  if (isLoading) {
    return (
      <section className="grid min-h-full place-items-center bg-slate-50 px-4 py-16 text-center select-none font-sans">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md shadow-violet-500/25 mb-3 animate-pulse">
            RQ
          </div>
          <p className="text-xs font-bold uppercase text-violet-600">Loading route details</p>
          <h1 className="mt-1 text-xl font-black text-slate-900">Opening course map...</h1>
        </div>
      </section>
    );
  }

  if (errorMessage || !course || routeCoordinates.length < 2 || !startPoint) {
    return (
      <section className="min-h-full bg-slate-50 space-y-4 px-4 py-10 text-center select-none font-sans">
        <p className="text-xs font-black uppercase text-rose-500">Route unavailable</p>
        <h1 className="text-2xl font-black text-slate-900">No route coordinates found</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          {errorMessage ?? 'This course does not have enough saved course points to render a route yet.'}
        </p>
        <Link
          to="/map"
          className="inline-block rounded-2xl bg-violet-600 px-5 py-3 font-bold text-xs text-white shadow-md shadow-violet-500/25"
        >
          Back to Map
        </Link>
      </section>
    );
  }

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-28 select-none">
      {/* 1. 상단 코스 타이틀 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
            {areaNameByArea[course.area]}
          </p>
          <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-0.5 text-[10px] font-black uppercase">
            {course.difficulty}
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900">{course.name}</h1>
        <p className="mt-1 text-xs text-slate-500">
          A verified runner route in {course.area}. Start quest to track GPS and earn XP.
        </p>
      </div>

      {/* 2. Leaflet 지도 (깨지지 않는 선명한 SVG Circle & DivIcon 마커) */}
      <div className="h-[380px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md relative">
        <MapContainer center={startPoint} zoom={15} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 선명한 보라빛 궤적 Polyline */}
          <Polyline
            positions={loopedRouteCoordinates}
            pathOptions={{ color: '#7c3aed', weight: 6, opacity: 0.95 }}
          />

          {/* 깨지지 않는 SVG 원형 및 DivIcon 마커들 */}
          {activityCourse?.checkpoints.map((checkpoint, index) => {
            const isStart = checkpoint.type === 'START';
            const isFinish = checkpoint.type === 'FINISH';
            const label = isStart ? 'S' : isFinish ? 'F' : String(index + 1);
            const color = isStart ? '#10b981' : isFinish ? '#f97316' : '#8b5cf6';

            return (
              <Marker
                key={checkpoint.id}
                position={checkpoint.position}
                icon={createPointIcon(label, color)}
              >
                <Popup>
                  <div className="text-center font-sans p-1">
                    <strong className="text-xs text-slate-900">{checkpoint.type}</strong>
                    <p className="text-[10px] text-slate-500 mt-0.5">{checkpoint.name}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 맵 하단 상태 워터마크 배지 */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur-md border border-slate-700">
          📍 Verified GPS Route Loaded
        </div>
      </div>

      {/* 3. 루프 배수 설정 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-black uppercase text-slate-400">Loop Multiplier (반복 횟수)</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setLoopCount(count)}
              className={`rounded-2xl py-2.5 text-xs font-black transition-all ${
                loopCount === count
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {count}x Loop
            </button>
          ))}
        </div>
      </div>

      {/* 4. 스탯 3열 그리드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
          <p className="font-black text-slate-900 text-sm mt-0.5">
            {totalDistanceKm} <span className="text-[10px] text-slate-500">km</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Reward</p>
          <p className="font-black text-amber-600 text-sm mt-0.5">+{xpReward} XP</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Est. Time</p>
          <p className="font-black text-violet-700 text-sm mt-0.5">
            {estimateTimeMinutes(totalDistanceKm)} <span className="text-[10px] text-slate-500">min</span>
          </p>
        </div>
      </div>

      {/* 5. 안전 유의사항 안내 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5">
        <span className="text-base">⚠️</span>
        <div>
          <h2 className="text-xs font-black text-amber-900">Safety & Traffic Note</h2>
          <p className="text-[11px] leading-relaxed text-amber-800 mt-0.5">
            Review the route before running and stay aware of local pedestrian walkways and traffic conditions.
          </p>
        </div>
      </div>

      {/* 6. 하단 액션 버튼 */}
      <div className="pt-2 space-y-2.5">
        <button
          type="button"
          onClick={startCourse}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-emerald-300/60"
        >
          <span className="text-lg">⚔️</span>
          <span>QUEST START (퀘스트 시작)</span>
        </button>

        <Link
          to={`/course-builder/${course.id}`}
          className="block w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs text-center shadow-sm active:scale-[0.98] transition-all"
        >
          🛠️ 코스 경로 수정 & 편집 (Edit Course)
        </Link>
      </div>
    </section>
  );
}
