import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CourseBuilderMap from '../components/CourseBuilderMap';
import { mockAreas } from '../data/mockAreas';
import type { LatLngTuple } from '../types/area';
import type { CheckpointType, CourseCheckpoint, Difficulty } from '../types/course';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getCourseById,
  saveRouteAsCourse,
  updateCourse,
  type CourseArea
} from '../services/courseService';
import { calculateHaversineDistanceKm, calculateRouteDistanceKm } from '../utils/route';

const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Challenge'];

function toDatabaseArea(areaName: string): CourseArea {
  if (areaName.includes('Makati')) {
    return 'Makati';
  }
  if (areaName.includes('MOA')) {
    return 'MOA';
  }
  return 'BGC';
}

function buildCheckpoints(routePoints: LatLngTuple[]): CourseCheckpoint[] {
  if (routePoints.length === 0) {
    return [];
  }

  return routePoints.map((point, index) => {
    const checkpointType: CheckpointType =
      index === 0 ? 'START' : index === routePoints.length - 1 ? 'FINISH' : 'CHECKPOINT';

    return {
      id: `builder-checkpoint-${index}`,
      name: `${checkpointType} ${index + 1}`,
      type: checkpointType,
      position: point,
      distanceFromStartKm: calculateRouteDistanceKm(routePoints.slice(0, index + 1))
    };
  });
}

function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function CourseBuilder() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState('My Field Route');
  const [areaId, setAreaId] = useState(mockAreas[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [routePoints, setRoutePoints] = useState<LatLngTuple[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(Boolean(courseId));
  
  // 실시간 GPS 및 타이머 상태
  const [isGpsRecording, setIsGpsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<LatLngTuple | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const lastPositionTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const selectedArea = mockAreas.find((area) => area.id === areaId) ?? mockAreas[0];
  const checkpoints = useMemo(() => buildCheckpoints(routePoints), [routePoints]);
  const routeDistanceKm = useMemo(() => calculateRouteDistanceKm(routePoints), [routePoints]);
  const estimatedXp = Math.round(routeDistanceKm * 100);

  // 1. 화면 꺼짐 방지 (Wake Lock) 요청/해제 함수
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // 미지원 기기 무시
    }
  }

  async function releaseWakeLock() {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // 무시
    }
  }

  // 2. 타이머 로직 (기록 중일 때 매초 증가)
  useEffect(() => {
    if (!isGpsRecording) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isGpsRecording]);

  // 3. 기존 코스 로드
  useEffect(() => {
    let isMounted = true;

    async function loadEditableCourse() {
      if (!courseId) return;

      try {
        setIsLoadingCourse(true);
        setSaveStatus('코스를 불러오는 중...');
        const editableCourse = await getCourseById(courseId);

        if (!isMounted || !editableCourse) return;

        const matchingArea = mockAreas.find((area) => toDatabaseArea(area.name) === editableCourse.area);
        setCourseName(editableCourse.name);
        setAreaId(matchingArea?.id ?? mockAreas[0].id);
        setDifficulty(editableCourse.difficulty);
        setRoutePoints(
          editableCourse.course_points.map((point) => [point.lat, point.lng] as LatLngTuple)
        );
        setSaveStatus(`코스 수정 모드: ${editableCourse.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '불러오기 실패';
        setSaveStatus(`에러: ${message}`);
      } finally {
        if (isMounted) setIsLoadingCourse(false);
      }
    }

    loadEditableCourse();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // 4. GPS 트래킹 및 Wake Lock 정리 & 탭 복귀 시 재요청
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGpsRecording) {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      void releaseWakeLock();
    };
  }, [isGpsRecording]);

  // 5. 하이브리드 GPS 기록 시작 함수
  function startGpsRecording() {
    if (!('geolocation' in navigator)) {
      setGpsError('위치 서비스를 지원하지 않는 기기입니다.');
      return;
    }

    void requestWakeLock();
    setIsGpsRecording(true);
    setGpsError(null);
    setSaveStatus('');
    lastSavedTimeRef.current = Date.now();
    lastPositionTimeRef.current = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentCoord: LatLngTuple = [position.coords.latitude, position.coords.longitude];
        const currentTime = Date.now();
        setGpsAccuracy(Math.round(position.coords.accuracy));

        // 속도 계산 (coords.speed 또는 수동 계산)
        if (position.coords.speed !== null && position.coords.speed >= 0) {
          setCurrentSpeedKmh(Number((position.coords.speed * 3.6).toFixed(1)));
        } else if (lastPointRef.current) {
          const deltaKm = calculateHaversineDistanceKm(lastPointRef.current, currentCoord);
          const deltaHours = (currentTime - lastPositionTimeRef.current) / 1000 / 3600;
          if (deltaHours > 0) {
            setCurrentSpeedKmh(Number(Math.min(30, deltaKm / deltaHours).toFixed(1)));
          }
        }
        lastPositionTimeRef.current = currentTime;

        let shouldAddPoint = false;

        if (!lastPointRef.current) {
          shouldAddPoint = true;
        } else {
          const distanceMovedKm = calculateHaversineDistanceKm(lastPointRef.current, currentCoord);
          const timeElapsedMs = currentTime - lastSavedTimeRef.current;

          // Jittering 방지: 3m 미만 무시
          if (distanceMovedKm < 0.003) {
            return;
          }

          // 조건 A: 10m 이상 이동 시 즉시 추가 (러닝/코너링)
          if (distanceMovedKm >= 0.01) {
            shouldAddPoint = true;
          }
          // 조건 B: 10초 경과 + 3m 이상 이동 시 추가 (느린 걸음 보완)
          else if (timeElapsedMs >= 10000 && distanceMovedKm >= 0.003) {
            shouldAddPoint = true;
          }
        }

        if (shouldAddPoint) {
          lastPointRef.current = currentCoord;
          lastSavedTimeRef.current = currentTime;
          setRoutePoints((prev) => [...prev, currentCoord]);
        }
      },
      (error) => {
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000
      }
    );
  }

  // 6. 실시간 GPS 기록 일시정지 함수
  function stopGpsRecording() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    void releaseWakeLock();
    setIsGpsRecording(false);
    setCurrentSpeedKmh(0);
    lastPointRef.current = null;
  }

  function addRoutePoint(position: LatLngTuple) {
    setRoutePoints((currentPoints) => [...currentPoints, position]);
  }

  function moveRoutePoint(index: number, position: LatLngTuple) {
    setRoutePoints((currentPoints) =>
      currentPoints.map((point, pointIndex) => (pointIndex === index ? position : point))
    );
  }

  function deleteRoutePoint(index: number) {
    setRoutePoints((currentPoints) =>
      currentPoints.filter((_, pointIndex) => pointIndex !== index)
    );
  }

  function undoLastPoint() {
    setRoutePoints((currentPoints) => currentPoints.slice(0, -1));
  }

  function clearRoute() {
    if (isGpsRecording) {
      stopGpsRecording();
    }
    setRoutePoints([]);
    setElapsedSeconds(0);
    setSaveStatus('');
  }

  // 7. 코스 저장 및 종료
  async function saveCourse() {
    if (isGpsRecording) {
      stopGpsRecording();
    }

    if (routePoints.length < 2) {
      setSaveStatus('⚠️ 최소 2개 이상의 포인트가 필요합니다.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('저장 중...');
    const databaseArea = toDatabaseArea(selectedArea.name);
    const distance = routeDistanceKm;

    try {
      if (courseId) {
        const id = await updateCourse(
          {
            id: courseId,
            name: courseName.trim() || 'Creator Route',
            area: databaseArea,
            difficulty,
            distance
          },
          routePoints
        );
        setSaveStatus(`✅ 수정 완료: ${id}`);
      } else {
        const id = await saveRouteAsCourse(
          {
            name: courseName.trim() || 'Creator Route',
            area: databaseArea,
            difficulty,
            distance
          },
          routePoints
        );
        setSaveStatus(`✅ 저장 완료: ${id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장 실패';
      setSaveStatus(
        isSupabaseConfigured
          ? `❌ DB 저장 실패: ${message}`
          : '⚠️ 로컬 저장 완료 (Supabase 미설정)'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 배경: 풀스크린 지도 (100vh) */}
      <div className="absolute inset-0 z-0">
        <CourseBuilderMap
          center={routePoints.length > 0 ? routePoints[routePoints.length - 1] : selectedArea.mapCenter}
          routePoints={routePoints}
          checkpoints={checkpoints}
          onAddRoutePoint={addRoutePoint}
          onMoveRoutePoint={moveRoutePoint}
          onDeleteRoutePoint={deleteRoutePoint}
        />
      </div>

      {/* 2. 상단 네비게이션 & GPS 상태 배지 (Step 3) */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center justify-between pointer-events-none">
        {/* 뒤로가기 버튼 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-bold text-xs shadow-lg shadow-black/10 active:scale-95 transition-all border border-slate-200/80"
        >
          <span>←</span>
          <span>나가기</span>
        </button>

        {/* 상단 우측 둥근 GPS 상태 배지 (Step 3) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-black/10 text-xs font-bold text-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isGpsRecording ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isGpsRecording ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </span>
            <span className="font-extrabold tracking-tight">GPS</span>
            {gpsAccuracy !== null && (
              <span className="text-[10px] text-slate-500 font-medium">±{gpsAccuracy}m</span>
            )}
          </div>
        </div>
      </header>

      {/* 3. 우측 플로팅 퀵 툴 (되돌리기 / 초기화) */}
      <aside className="absolute right-4 top-20 z-20 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={undoLastPoint}
          disabled={routePoints.length === 0}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-700 font-bold shadow-lg flex items-center justify-center active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="마지막 포인트 취소"
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={clearRoute}
          disabled={routePoints.length === 0 && elapsedSeconds === 0}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 text-rose-500 font-bold shadow-lg flex items-center justify-center active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="전체 초기화"
        >
          🗑️
        </button>
      </aside>

      {/* 4. 하단 모던 화이트 바텀시트 UI (Step 1 & Step 2) */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white text-slate-900 rounded-t-3xl shadow-[0_-6px_30px_rgba(0,0,0,0.12)] px-6 pt-5 pb-7 transition-all duration-300">
        <div className="max-w-md mx-auto flex flex-col">
          {/* 바텀시트 상단 드래그 핸들 바 */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

          {/* 상단 라인: 코스 이름 & 설정 인라인 */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="코스 이름 입력"
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 transition-all"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700"
              >
                {mockAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-600"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 패널 상단: 실시간 진행 시간 & 원형 액션 컨트롤러 (Step 2) */}
          <div className="flex items-center justify-between gap-4">
            {/* 좌측: 거대한 시간 타이포그래피 */}
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isGpsRecording ? '🔴 REC TIME' : 'TIME ELAPSED'}
              </span>
              <span className="text-4xl font-black tracking-tight text-slate-900 tabular-nums">
                {formatElapsedTime(elapsedSeconds)}
              </span>
            </div>

            {/* 우측: 크고 동그란 원형 액션 버튼 (w-16 h-16 rounded-full) */}
            <div className="flex items-center gap-2">
              {!isGpsRecording ? (
                <button
                  type="button"
                  onClick={startGpsRecording}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center text-2xl transition-all duration-200 border-2 border-emerald-300/40"
                  title="기록 시작"
                >
                  ▶️
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopGpsRecording}
                  className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xl shadow-amber-500/30 flex items-center justify-center text-2xl transition-all duration-200 border-2 border-amber-300/40 animate-pulse"
                  title="일시정지"
                >
                  ⏸️
                </button>
              )}

              {/* 저장 및 완료 버튼 */}
              <button
                type="button"
                onClick={() => void saveCourse()}
                disabled={routePoints.length < 2 || isSaving || isLoadingCourse}
                className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-lg flex items-center justify-center text-lg transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                title="기록 종료 및 저장"
              >
                {isSaving ? '⏳' : '💾'}
              </button>
            </div>
          </div>

          {/* 패널 하단: 3칸 스탯 그리드 (거리, 포인트/XP, 속도) (Step 2) */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-100 text-center">
            {/* 1. 이동 거리 */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">거리</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">
                {routeDistanceKm.toFixed(2)}
                <span className="text-xs font-semibold text-slate-500 ml-0.5">km</span>
              </span>
            </div>

            {/* 2. 수집 포인트 / 예상 XP */}
            <div className="flex flex-col items-center border-x border-slate-100 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">예상 보상</span>
              <span className="text-xl font-black text-amber-500 tabular-nums">
                +{estimatedXp}
                <span className="text-xs font-semibold text-slate-500 ml-0.5">XP</span>
              </span>
            </div>

            {/* 3. 현재 속도 */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">현재 속도</span>
              <span className="text-xl font-black text-teal-600 tabular-nums">
                {currentSpeedKmh.toFixed(1)}
                <span className="text-xs font-semibold text-slate-500 ml-0.5">km/h</span>
              </span>
            </div>
          </div>

          {/* 상태/에러 메시지 알림 바 */}
          {(saveStatus || gpsError) && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-700">
              {saveStatus || gpsError}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
