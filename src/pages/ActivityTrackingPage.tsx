import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ActivityState, CompletedActivitySummary } from '../types/activity';
import type { LatLngTuple } from '../types/area';
import type { Course, CourseCheckpoint } from '../types/course';
import { calculateActivityReward, getGameProgress } from '../utils/gameProgress';
import { calculateRouteProgress } from '../utils/route';
import {
  completeGpsSession,
  isBrowserGpsAvailable,
  startGpsSession,
  watchBrowserGpsSession
} from '../features/gps/gpsSyncService';
import {
  generateNearbyRunners,
  checkHighFiveProximity,
  type LiveNearbyRunner
} from '../services/liveEncounterService';

type RunNavigationState = {
  course: Course;
  baseCourse?: Course;
  loopCount?: number;
  totalDistance?: number;
};

function isRunNavigationState(state: unknown): state is RunNavigationState {
  return Boolean(state && typeof state === 'object' && 'course' in state);
}

function createLoopedRoute(routeCoordinates: LatLngTuple[], loopCount: number) {
  return Array.from({ length: loopCount }).flatMap((_, loopIndex) =>
    loopIndex === 0 ? routeCoordinates : routeCoordinates.slice(1)
  );
}

function createLoopedCourse(baseCourse: Course, loopCount: number): Course {
  const routeCoordinates = createLoopedRoute(baseCourse.routeCoordinates, loopCount);
  const distanceKm = Number((baseCourse.distanceKm * loopCount).toFixed(2));

  return {
    ...baseCourse,
    distanceKm,
    estimatedTimeMin: Math.max(5, Math.round(distanceKm * 9)),
    xpReward: Math.round(distanceKm * 100),
    explorationReward: Math.max(3, Math.round(distanceKm * 5)),
    startPoint: routeCoordinates[0] ?? baseCourse.startPoint,
    finishPoint: routeCoordinates[routeCoordinates.length - 1] ?? baseCourse.finishPoint,
    routeCoordinates,
    checkpoints: Array.from({ length: loopCount }).flatMap((_, loopIndex) =>
      baseCourse.checkpoints.map((checkpoint, checkpointIndex) => ({
        ...checkpoint,
        id: `${checkpoint.id}-run-loop-${loopIndex + 1}`,
        name: `${checkpoint.name} / Loop ${loopIndex + 1}`,
        type:
          loopIndex === 0 && checkpoint.type === 'START'
            ? 'START'
            : loopIndex === loopCount - 1 && checkpoint.type === 'FINISH'
              ? 'FINISH'
              : 'CHECKPOINT',
        distanceFromStartKm:
          baseCourse.checkpoints.length > 1
            ? Number(
                (
                  (distanceKm / (baseCourse.checkpoints.length * loopCount - 1)) *
                  (loopIndex * baseCourse.checkpoints.length + checkpointIndex)
                ).toFixed(2)
              )
            : 0
      }))
    )
  };
}

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

const checkpointColors: Record<CourseCheckpoint['type'], string> = {
  START: '#22c55e',
  CHECKPOINT: '#facc15',
  REST: '#38bdf8',
  VIEW: '#a78bfa',
  VIEW_SPOT: '#a78bfa',
  WATER: '#0ea5e9',
  TOILET: '#94a3b8',
  CAFE: '#fb923c',
  CAUTION: '#fb7185',
  FINISH: '#f97316'
};

const userGpsIcon = L.divIcon({
  className: '',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-emerald-400/40 animate-ping"></div>
      <div class="relative w-6 h-6 rounded-full border-2 border-white bg-gradient-to-tr from-emerald-500 to-teal-300 shadow-[0_0_16px_rgba(16,185,129,0.9)] flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// 지도 중심을 사용자 위치에 맞추는 헬퍼 컴포넌트
function MapRecenter({ position, isTracking }: { position: LatLngTuple; isTracking: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isTracking) {
      map.panTo(position, { animate: true, duration: 1 });
    }
  }, [position, isTracking, map]);
  return null;
}

export default function ActivityTrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state;
  const initialCourse = isRunNavigationState(navigationState)
    ? navigationState.course
    : (navigationState as Course | null);
  const baseCourse = isRunNavigationState(navigationState)
    ? (navigationState.baseCourse ?? navigationState.course)
    : initialCourse;
  
  const [loopCount, setLoopCount] = useState(
    isRunNavigationState(navigationState) ? (navigationState.loopCount ?? 1) : 1
  );
  
  const course = useMemo(
    () => (baseCourse ? createLoopedCourse(baseCourse, loopCount) : null),
    [baseCourse, loopCount]
  );

  const [activityState, setActivityState] = useState<ActivityState>('idle');
  const [gpsSessionId, setGpsSessionId] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<LatLngTuple>(
    course?.startPoint ?? [14.5503, 121.0507]
  );
  // 1분 단위로 수집된 GPS 궤적 좌표 리스트 (Step 2 & 3 연동)
  const [trackedPath, setTrackedPath] = useState<LatLngTuple[]>([]);
  const [gpsStatus, setGpsStatus] = useState('GPS ready');
  const isStartingRef = useRef(false);

  // Phase 4: 주변 라이브 러너 및 High-Five 이벤트
  const [nearbyRunners, setNearbyRunners] = useState<LiveNearbyRunner[]>([]);
  const [highFiveEvent, setHighFiveEvent] = useState<{ runner: LiveNearbyRunner; timestamp: number } | null>(null);

  useEffect(() => {
    if (activityState === 'running') {
      const runners = generateNearbyRunners(currentPosition);
      setNearbyRunners(runners);

      // 근접 시 하이파이브 체크
      const closeRunner = checkHighFiveProximity(currentPosition, runners);
      if (closeRunner && (!highFiveEvent || Date.now() - highFiveEvent.timestamp > 15000)) {
        setHighFiveEvent({ runner: closeRunner, timestamp: Date.now() });
        // 햅틱 진동 피드백
        try {
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        } catch {
          // ignore
        }
        setTimeout(() => setHighFiveEvent(null), 4000);
      }
    }
  }, [currentPosition, activityState]);

  // 캐릭터 기본 스탯
  const progressSnapshot = getGameProgress();
  const rewardPreview = course
    ? calculateActivityReward(course, distanceKm, progressSnapshot.completedActivities)
    : { baseXp: 0, difficultyBonusXp: 0, consistencyBonusXp: 0, totalXp: 0 };
  const xpEarned = rewardPreview.totalXp;
  const routeCoordinates = course?.routeCoordinates ?? [];
  const routeMatch = calculateRouteProgress(currentPosition, routeCoordinates);
  const distanceProgress = course ? Math.min(distanceKm / course.distanceKm, 1) : 0;
  const routeProgress = Math.max(routeMatch.progressPercent / 100, distanceProgress);
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
    if (course && activityState === 'idle') {
      setCurrentPosition(course.startPoint);
      setDistanceKm(0);
      setGpsSessionId(null);
      setTrackedPath([course.startPoint]);
    }
  }, [activityState, course]);

  // Screen Wake Lock (화면 꺼짐 방지)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestLock() {
      try {
        if ('wakeLock' in navigator && activityState === 'running') {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // 미지원 브라우저 등 무시
      }
    }

    if (activityState === 'running') {
      void requestLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && activityState === 'running') {
        void requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) {
        void wakeLock.release();
      }
    };
  }, [activityState]);

  // 경과 시간 타이머
  useEffect(() => {
    if (activityState !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activityState]);

  // 하이브리드 GPS 추적 (10m 거리 / 10초 보완 / 3m Jittering 방지)
  useEffect(() => {
    if (!course || activityState !== 'running' || !gpsSessionId) {
      return undefined;
    }

    setGpsStatus('Searching GPS signals...');
    return watchBrowserGpsSession({
      sessionId: gpsSessionId,
      minDistanceMeters: 10, // 10m 이상 이동 시 (코너링/러닝 대응)
      fallbackTimeIntervalMs: 10_000, // 10초 경과 보완
      minJitterMeters: 3, // 3m 미만 떨림 필터링
      onRawPoint: (rawPoint) => {
        // 실시간 지도 마커 위치 업데이트
        setCurrentPosition([rawPoint.lat, rawPoint.lng]);
      },
      onPoint: (point, session) => {
        // 하이브리드 조건 충족 시 Polyline 궤적 배열에 추가
        setTrackedPath((prev) => [...prev, [point.lat, point.lng]]);
        setDistanceKm(Math.min(session.total_distance, course.distanceKm));
        setGpsStatus(`GPS Active +/-${Math.round(point.accuracy ?? 0)}m (Hybrid)`);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'GPS tracking failed.';
        setGpsStatus(message);
        setActivityState('paused');
      }
    });
  }, [activityState, course, gpsSessionId]);

  useEffect(() => {
    if (course && distanceKm >= course.distanceKm && activityState === 'running') {
      void completeActivity();
    }
  });

  async function startActivity() {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setGpsStatus('🛰️ GPS 위성 연결 및 위치 탐색 중...');
    // 즉각 러닝 상태로 전환하여 화면 오버레이를 걷고 러닝 HUD를 표시
    setActivityState('running');

    // 1. 브라우저 GPS 즉각 첫 위치 획득
    if (isBrowserGpsAvailable()) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoord: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPosition(userCoord);
          setTrackedPath((prev) => (prev.length <= 1 ? [userCoord] : prev));
          setGpsStatus(`GPS Active +/-${Math.round(pos.coords.accuracy)}m`);
        },
        (err) => {
          console.warn('GPS initial lock notice:', err.message);
          setGpsStatus('GPS 연결 대기 중 (실외에서 신호가 더 잘 잡힙니다)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // 2. 세션 초기화 (Supabase + Local Fallback)
    try {
      const session = await startGpsSession({ provider: 'browser_geolocation' });
      setGpsSessionId(session.id);
    } catch (error) {
      console.warn('Using local GPS session:', error);
      setGpsSessionId(`local-session-${Date.now()}`);
    } finally {
      isStartingRef.current = false;
    }
  }

  function pauseActivity() {
    setActivityState('paused');
  }

  function resumeActivity() {
    setActivityState('running');
  }

  async function completeActivity() {
    if (!course) {
      navigate('/map', { replace: true });
      return;
    }

    if (gpsSessionId) {
      await completeGpsSession(gpsSessionId);
    }

    const summary: CompletedActivitySummary = {
      activityId: `activity-${course.id}-${Date.now()}`,
      courseId: course.id,
      courseName: course.name,
      areaName: course.areaName,
      difficulty: course.difficulty,
      loopCount,
      gpsSessionId: gpsSessionId ?? undefined,
      distanceKm,
      durationSeconds: elapsedSeconds
    };

    setActivityState('completed');
    navigate(`/completed/${course.id}`, { state: summary });
  }

  if (!course) {
    return null;
  }

  const isTracking = activityState === 'running';

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 배경: 풀스크린 탐험 지도 (Step 1 & Step 3) */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={currentPosition}
          zoom={16}
          scrollWheelZoom={false}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter position={currentPosition} isTracking={isTracking} />
          
          {/* 전체 계획 코스 가이드선 (반투명 슬레이트) */}
          <Polyline 
            positions={course.routeCoordinates} 
            pathOptions={{ color: '#64748b', weight: 6, opacity: 0.45, dashArray: '8, 8' }} 
          />

          {/* Step 3: 실시간 1분 단위 GPS 수집 궤적 Polyline (네온 황금빛 라인) */}
          <Polyline 
            positions={trackedPath} 
            pathOptions={{ color: '#facc15', weight: 7, opacity: 0.95 }} 
          />

          {/* 체크포인트 마커들 */}
          {course.checkpoints.map((cp) => (
            <CircleMarker
              key={cp.id}
              center={cp.position}
              radius={cp.type === 'START' || cp.type === 'FINISH' ? 9 : 6}
              pathOptions={{
                color: '#0f172a',
                fillColor: checkpointColors[cp.type] ?? '#facc15',
                fillOpacity: 1,
                weight: 2
              }}
            />
          ))}

          {/* 유저 실시간 GPS 위치 마커 */}
          <Marker position={currentPosition} icon={userGpsIcon} />

          {/* Phase 4: 주변 라이브 러너 미니 핀 렌더링 */}
          {isTracking &&
            nearbyRunners.map((runner) => (
              <Marker
                key={runner.id}
                position={runner.currentPosition}
                icon={L.divIcon({
                  className: '',
                  html: `
                    <div class="flex flex-col items-center animate-pulse">
                      <div class="w-8 h-8 rounded-full bg-violet-600 border-2 border-white shadow-lg flex items-center justify-center text-sm">
                        ${runner.avatar}
                      </div>
                      <span class="mt-0.5 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-white text-[8px] font-bold whitespace-nowrap">
                        ${runner.name.slice(0, 8)}
                      </span>
                    </div>
                  `,
                  iconSize: [36, 42],
                  iconAnchor: [18, 21]
                })}
              />
            ))}
        </MapContainer>

        {/* Phase 4: ✋ High-Five 실시간 인카운터 팝업 모달 */}
        {highFiveEvent && (
          <div className="absolute top-20 left-4 right-4 z-40 animate-in slide-in-from-top duration-300 pointer-events-none">
            <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-white flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">✋</span>
                <div>
                  <p className="font-black text-sm text-slate-950">High-Five Encounter!</p>
                  <p className="text-xs text-white/90 font-bold">
                    Passed by <strong>{highFiveEvent.runner.name}</strong> · <span className="text-amber-200">+50 Bonus XP</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-full">Nice Pace!</span>
            </div>
          </div>
        )}

        {/* Phase 4: 주변 실시간 러너 감지 배지 (우측 상단) */}
        {isTracking && nearbyRunners.length > 0 && (
          <div className="absolute top-16 right-4 z-20 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] font-black text-violet-300 shadow-md flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{nearbyRunners.length} nearby runners</span>
            </div>
          </div>
        )}

        {/* 맵 가장자리 비네팅 및 HUD 가독성 오버레이 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
      </div>

      {/* 2. 상단 오버레이: RPG 플레이어 스탯 HUD 바 (Step 1) */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-3 shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between gap-3">
            {/* 레벨 & 프로필 뱃지 */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 border border-amber-300/40 shadow-inner font-black text-amber-100 text-xs">
                Lv.12
              </div>
            </div>

            {/* HP 및 EXP 게이지 */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {/* HP 바 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-rose-400 uppercase">HP</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                    style={{ width: `${Math.max(20, 100 - (distanceProgress * 50))}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-300 tabular-nums">
                  {Math.round(Math.max(20, 100 - (distanceProgress * 50)))}/100
                </span>
              </div>

              {/* EXP 게이지 (루트 달성률 기반) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-amber-400 uppercase">EXP</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                    style={{ width: `${Math.round(routeProgress * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-amber-300 tabular-nums">
                  {Math.round(routeProgress * 100)}%
                </span>
              </div>
            </div>

            {/* 획득 보상 토큰/골드 */}
            <div className="flex items-center gap-1 bg-slate-800/90 border border-amber-400/40 px-2.5 py-1 rounded-xl">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-yellow-300 tabular-nums">
                +{xpEarned} <span className="text-[9px] font-medium text-slate-400">XP</span>
              </span>
            </div>
          </div>

          {/* 서브 퀘스트 정보 & 목표 체크포인트 & 루프 배수 선택 바 */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 font-black text-[9px] border border-teal-500/30 shrink-0">
                QUEST
              </span>
              <span className="font-bold text-slate-200 truncate">{course.name}</span>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                • 목표: <span className="text-amber-300 font-bold">{nextCheckpoint?.name ?? 'Finish'}</span>
              </span>
            </div>
            
            {/* 루프 배수 조절 버튼 (탐험 대기 중일 때만 변경 가능) */}
            <div className="flex items-center gap-1 shrink-0">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setLoopCount(count)}
                  disabled={activityState !== 'idle'}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    loopCount === count
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 3. 중앙 캐릭터 영상 Placeholder 영역 (대기 중에만 표시하여 러닝 중 지도 시야 확보) */}
      {activityState === 'idle' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-52 top-28 z-10 flex items-center justify-center">
          <div className="relative">
            {/* 캐릭터 아우라 효과 */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-teal-500/20 rounded-full blur-xl animate-pulse" />
            
            {/* 캐릭터 Video/Canvas 컨테이너 Placeholder */}
            <div className="relative w-44 h-52 rounded-3xl border border-teal-400/30 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-teal-950/80 border border-teal-400/40 flex items-center justify-center text-2xl shadow-lg">
                  🛡️
                </div>
                <p className="text-xs font-bold text-teal-200">
                  모험 준비 완료
                </p>
                <span className="text-[9px] text-slate-400">
                  [캐릭터 Video/3D Canvas]
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 하단 플로팅 액션바 & 대형 START 버튼 (Step 1) */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-2">
        <div className="max-w-lg mx-auto flex flex-col gap-2.5">
          {/* GPS 상태 표시줄 */}
          <div className="flex items-center justify-between text-[11px] px-2 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {gpsStatus}
            </span>
            <span className="font-mono">{loopCount}x Loop ({course.distanceKm.toFixed(2)} km)</span>
          </div>

          {/* 탐험 중 실시간 대시보드 지표 */}
          {activityState !== 'idle' && (
            <div className="grid grid-cols-3 gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-xl text-center">
              <div className="p-1">
                <div className="text-[9px] font-black text-slate-400 uppercase">탐험 시간</div>
                <div className="text-base font-black text-slate-100 tabular-nums">
                  {formatElapsedTime(elapsedSeconds)}
                </div>
              </div>
              <div className="p-1 border-x border-slate-800">
                <div className="text-[9px] font-black text-slate-400 uppercase">이동 거리</div>
                <div className="text-base font-black text-teal-400 tabular-nums">
                  {distanceKm.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">km</span>
                </div>
              </div>
              <div className="p-1">
                <div className="text-[9px] font-black text-slate-400 uppercase">평균 페이스</div>
                <div className="text-base font-black text-amber-300 tabular-nums">
                  {formatPace(distanceKm, elapsedSeconds)}
                </div>
              </div>
            </div>
          )}

          {/* 대형 START / PAUSE / FINISH 플로팅 버튼 */}
          {activityState === 'idle' ? (
            <button
              onClick={() => void startActivity()}
              type="button"
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-lg tracking-wider uppercase shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 border border-emerald-300/60"
            >
              <span className="text-xl">⚔️</span>
              <span>QUEST START (퀘스트 시작)</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activityState === 'running' ? (
                <button
                  type="button"
                  onClick={pauseActivity}
                  className="py-3.5 px-4 rounded-xl bg-slate-800/90 border border-slate-600 text-slate-200 font-black text-sm tracking-wide uppercase shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>⏸️</span> 일시 정지
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeActivity}
                  className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>▶️</span> 탐험 재개
                </button>
              )}
              <button
                type="button"
                onClick={() => void completeActivity()}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-sm tracking-wide uppercase shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-rose-400/40"
              >
                <span>🏁</span> 퀘스트 완료
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
