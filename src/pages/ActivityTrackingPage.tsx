import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import type { ActivityState, CompletedActivitySummary, TrackingMode } from '../types/activity';
import type { LatLngTuple } from '../types/area';
import type { Course } from '../types/course';
import { calculateActivityReward, getGameProgress } from '../utils/gameProgress';
import { calculateHaversineDistanceKm, calculateRouteProgress } from '../utils/route';

const distancePerSecondKm = 0.02;
const maxReasonableGpsJumpKm = 0.25;

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatPace(distanceKm: number, elapsedSeconds: number) {
  if (distanceKm <= 0 || elapsedSeconds <= 0) {
    return '--:--';
  }

  const paceSeconds = Math.round(elapsedSeconds / distanceKm);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ActivityTrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state as Course | null;
  const [activityState, setActivityState] = useState<ActivityState>('idle');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('gps');
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<LatLngTuple>(
    course?.startPoint ?? [14.5503, 121.0507]
  );
  const previousGpsPositionRef = useRef<LatLngTuple | null>(null);
  const [gpsStatus, setGpsStatus] = useState('GPS ready');
  const progressSnapshot = getGameProgress();
  const rewardPreview = course
    ? calculateActivityReward(course, distanceKm, progressSnapshot.completedActivities)
    : { baseXp: 0, difficultyBonusXp: 0, consistencyBonusXp: 0, totalXp: 0 };
  const xpEarned = rewardPreview.totalXp;
  const routeCoordinates = course?.routeCoordinates ?? [];
  const routeMatch = calculateRouteProgress(currentPosition, routeCoordinates);
  const distanceProgress = course ? Math.min(distanceKm / course.distanceKm, 1) : 0;
  const routeProgress = Math.max(routeMatch.progressPercent / 100, distanceProgress);
  const mockCompletedPointCount = Math.max(
    1,
    Math.ceil(distanceProgress * routeCoordinates.length)
  );
  const completedSegment =
    trackingMode === 'gps'
      ? routeMatch.completedSegment
      : routeCoordinates.slice(0, mockCompletedPointCount);
  const nextCheckpoint = useMemo(
    () =>
      course?.checkpoints.find((checkpoint) => checkpoint.distanceFromStartKm > distanceKm) ??
      course?.checkpoints[course.checkpoints.length - 1],
    [course, distanceKm]
  );

  useEffect(() => {
    if (!course) {
      navigate('/map', { replace: true });
    }
  }, [course, navigate]);

  useEffect(() => {
    if (activityState !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activityState]);

  useEffect(() => {
    if (!course || activityState !== 'running' || trackingMode !== 'mock') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setDistanceKm((current) => Math.min(current + distancePerSecondKm, course.distanceKm));
      setCurrentPosition((current) => {
        const nextProgress = Math.min((distanceKm + distancePerSecondKm) / course.distanceKm, 1);
        const nextIndex = Math.min(
          course.routeCoordinates.length - 1,
          Math.floor(nextProgress * (course.routeCoordinates.length - 1))
        );

        return course.routeCoordinates[nextIndex] ?? current;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activityState, course, distanceKm, trackingMode]);

  useEffect(() => {
    if (!course || activityState !== 'running' || trackingMode !== 'gps') {
      return undefined;
    }

    if (!navigator.geolocation) {
      setTrackingMode('mock');
      setGpsStatus('GPS unavailable. Mock tracking enabled.');
      return undefined;
    }

    setGpsStatus('Waiting for GPS lock...');
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition: LatLngTuple = [position.coords.latitude, position.coords.longitude];
        setCurrentPosition(nextPosition);
        setGpsStatus(`GPS active ±${Math.round(position.coords.accuracy)}m`);
        const previousPosition = previousGpsPositionRef.current;

        if (previousPosition) {
          const nextDistance = calculateHaversineDistanceKm(previousPosition, nextPosition);
          if (nextDistance > 0 && nextDistance < maxReasonableGpsJumpKm) {
            setDistanceKm((current) => Math.min(current + nextDistance, course.distanceKm));
          }
        }

        previousGpsPositionRef.current = nextPosition;
      },
      () => {
        setTrackingMode('mock');
        setGpsStatus('GPS permission unavailable. Mock tracking enabled.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 8000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activityState, course, trackingMode]);

  useEffect(() => {
    if (course && distanceKm >= course.distanceKm && activityState === 'running') {
      completeActivity();
    }
  });

  function startActivity() {
    setGpsStatus('Starting tracker...');
    setActivityState('running');
  }

  function pauseActivity() {
    setActivityState('paused');
  }

  function resumeActivity() {
    setActivityState('running');
  }

  function completeActivity() {
    if (!course) {
      navigate('/map', { replace: true });
      return;
    }

    const summary: CompletedActivitySummary = {
      activityId: `activity-${course.id}-${Date.now()}`,
      courseId: course.id,
      distanceKm,
      durationSeconds: elapsedSeconds
    };

    setActivityState('completed');
    navigate(`/completed/${course.id}`, { state: summary });
  }

  if (!course) {
    return null;
  }

  const primaryAction =
    activityState === 'idle' ? (
      <button
        type="button"
        onClick={startActivity}
        className="rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
      >
        Start
      </button>
    ) : activityState === 'paused' ? (
      <button
        type="button"
        onClick={resumeActivity}
        className="rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
      >
        Resume
      </button>
    ) : (
      <button
        type="button"
        onClick={pauseActivity}
        className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-4 font-black text-stone-100"
      >
        Pause
      </button>
    );

  return (
    <section className="min-h-full bg-[#111816] px-4 py-4 text-stone-50">
      <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-quest-teal">
              {trackingMode === 'gps' ? 'Real GPS activity' : 'Mock fallback activity'}
            </p>
            <h1 className="mt-1 text-2xl font-black">{course.name}</h1>
          </div>
          <span className="rounded-full bg-teal-950 px-3 py-2 text-xs font-black uppercase text-quest-teal">
            {activityState}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-700">
        <MapContainer center={course.startPoint} zoom={16} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={course.routeCoordinates} color="#475569" weight={6} />
          <Polyline positions={completedSegment} color="#facc15" weight={7} />
          <Marker position={currentPosition} />
        </MapContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-bold uppercase text-stone-500">Distance</p>
          <p className="mt-1 text-2xl font-black">{distanceKm.toFixed(2)} km</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-bold uppercase text-stone-500">Elapsed</p>
          <p className="mt-1 text-2xl font-black">{formatElapsedTime(elapsedSeconds)}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-bold uppercase text-stone-500">Avg pace</p>
          <p className="mt-1 text-2xl font-black">{formatPace(distanceKm, elapsedSeconds)}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-4">
          <p className="text-xs font-bold uppercase text-stone-500">XP</p>
          <p className="mt-1 text-2xl font-black text-amber-200">{xpEarned}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-700 bg-stone-900 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-black uppercase text-stone-500">Route progress</span>
          <span className="font-black text-amber-200">{Math.round(routeProgress * 100)}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-950">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-500"
            style={{ width: `${routeProgress * 100}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-stone-500">Next checkpoint</p>
        <p className="mt-1 font-black text-stone-50">{nextCheckpoint?.name ?? 'Finish line'}</p>
        <div className="mt-4 rounded-xl bg-stone-950 p-3">
          <p className="text-xs font-black uppercase text-stone-500">Tracking mode</p>
          <p className="mt-1 text-sm font-bold text-stone-300">{gpsStatus}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {primaryAction}
        <button
          type="button"
          onClick={completeActivity}
          disabled={activityState === 'idle'}
          className="rounded-2xl bg-quest-teal px-4 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
        >
          Finish
        </button>
      </div>
    </section>
  );
}
