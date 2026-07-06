import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { getCourseById, type CourseWithPoints } from '../services/courseService';
import type { LatLngTuple } from '../types/area';
import type { Course, CourseCheckpoint } from '../types/course';

const areaNameByArea: Record<CourseWithPoints['area'], string> = {
  BGC: 'BGC',
  Makati: 'Makati / Ayala Triangle',
  MOA: 'MOA / Pasay'
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

        if (!isMounted) {
          return;
        }

        setCourse(nextCourse);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load route details.';
        setErrorMessage(message);
        setCourse(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
    if (!course || loopedRouteCoordinates.length < 2) {
      return null;
    }

    const checkpoints: CourseCheckpoint[] = Array.from({ length: loopCount }).flatMap(
      (_, loopIndex) =>
        course.course_points.map((point, pointIndex) => {
          const routePointIndex = loopIndex * (routeCoordinates.length - 1) + pointIndex;
          return {
            id: `${point.id}-loop-${loopIndex + 1}`,
            name:
              point.type === 'start'
                ? `Start Gate ${loopIndex + 1}`
                : point.type === 'finish'
                  ? `Finish Gate ${loopIndex + 1}`
                  : `Checkpoint ${pointIndex} / Loop ${loopIndex + 1}`,
            type:
              loopIndex === 0 && point.type === 'start'
                ? 'START'
                : loopIndex === loopCount - 1 && point.type === 'finish'
                  ? 'FINISH'
                  : 'CHECKPOINT',
            position: [point.lat, point.lng] as LatLngTuple,
            distanceFromStartKm:
              loopedRouteCoordinates.length > 1
                ? Number(
                    (
                      (totalDistanceKm / (loopedRouteCoordinates.length - 1)) *
                      routePointIndex
                    ).toFixed(2)
                  )
                : 0
          } satisfies CourseCheckpoint;
        })
    );

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
      checkpoints,
      pois: [],
      safetyNotes: 'Review the route before running and stay aware of local traffic conditions.'
    };
  }, [
    course,
    explorationReward,
    loopCount,
    loopedRouteCoordinates,
    routeCoordinates.length,
    totalDistanceKm,
    xpReward
  ]);
  const baseActivityCourse = useMemo<Course | null>(() => {
    if (!course || routeCoordinates.length < 2) {
      return null;
    }

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

  if (isLoading) {
    return (
      <section className="grid min-h-full place-items-center px-4 py-10 text-center">
        <div>
          <p className="text-sm font-bold uppercase text-quest-teal">Loading route</p>
          <h1 className="mt-2 text-3xl font-black text-quest-ink">Opening course details...</h1>
        </div>
      </section>
    );
  }

  if (errorMessage || !course || routeCoordinates.length < 2 || !startPoint) {
    return (
      <section className="space-y-4 px-4 py-10 text-center">
        <p className="text-sm font-bold uppercase text-quest-teal">Route unavailable</p>
        <h1 className="text-3xl font-black text-quest-ink">No Supabase route found</h1>
        <p className="text-slate-600">
          {errorMessage ??
            'This course does not have enough saved course points to render a route yet.'}
        </p>
        <Link
          to="/map"
          className="inline-block rounded-xl bg-quest-teal px-4 py-3 font-bold text-white"
        >
          Back to Map
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4 px-4 py-4">
      <div>
        <p className="text-sm font-bold text-quest-teal">{areaNameByArea[course.area]}</p>
        <h1 className="mt-1 text-3xl font-black text-quest-ink">{course.name}</h1>
        <p className="mt-2 text-slate-600">
          A community-created {course.area} route loaded from Supabase.
        </p>
      </div>

      <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={startPoint} zoom={15} scrollWheelZoom={false} className="h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={loopedRouteCoordinates} color="#14b8a6" />
          {activityCourse?.checkpoints.map((checkpoint, index) => (
            <Marker key={checkpoint.id} position={checkpoint.position}>
              <Popup>
                {checkpoint.type} {index + 1}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase text-slate-500">Loop multiplier</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setLoopCount(count)}
              className={`rounded-xl border px-4 py-3 font-black ${
                loopCount === count
                  ? 'border-quest-teal bg-quest-teal text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {count}x
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Distance</p>
          <p className="font-bold">
            {baseDistanceKm} km → {totalDistanceKm} km ({loopCount}x)
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Reward</p>
          <p className="font-bold">{xpReward} XP</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Time</p>
          <p className="font-bold">{estimateTimeMinutes(totalDistanceKm)} min</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-bold text-amber-900">Safety notes</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Review the route before running and stay aware of local traffic conditions.
        </p>
      </div>

      <button
        type="button"
        onClick={startCourse}
        className="block rounded-xl bg-quest-teal px-4 py-3 text-center font-bold text-white"
      >
        Start Course
      </button>

      <Link
        to={`/course-builder/${course.id}`}
        className="block rounded-xl border border-quest-teal px-4 py-3 text-center font-bold text-quest-teal"
      >
        Edit Course
      </Link>

      <p className="text-center text-xs text-slate-500">Explore reward: +{explorationReward}%</p>
    </section>
  );
}
