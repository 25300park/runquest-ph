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
  
  // 실시간 GPS 필드 레코딩 상태
  const [isGpsRecording, setIsGpsRecording] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<LatLngTuple | null>(null);

  const selectedArea = mockAreas.find((area) => area.id === areaId) ?? mockAreas[0];
  const checkpoints = useMemo(() => buildCheckpoints(routePoints), [routePoints]);
  const routeDistanceKm = useMemo(() => calculateRouteDistanceKm(routePoints), [routePoints]);

  // 기존 코스 수정 시 로드
  useEffect(() => {
    let isMounted = true;

    async function loadEditableCourse() {
      if (!courseId) return;

      try {
        setIsLoadingCourse(true);
        setSaveStatus('Loading course for editing...');
        const editableCourse = await getCourseById(courseId);

        if (!isMounted || !editableCourse) return;

        const matchingArea = mockAreas.find((area) => toDatabaseArea(area.name) === editableCourse.area);
        setCourseName(editableCourse.name);
        setAreaId(matchingArea?.id ?? mockAreas[0].id);
        setDifficulty(editableCourse.difficulty);
        setRoutePoints(
          editableCourse.course_points.map((point) => [point.lat, point.lng] as LatLngTuple)
        );
        setSaveStatus(`Editing course: ${editableCourse.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Course load error.';
        setSaveStatus(`Load failed: ${message}`);
      } finally {
        if (isMounted) setIsLoadingCourse(false);
      }
    }

    loadEditableCourse();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // GPS 트래킹 정리
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 실시간 GPS 기록 시작 함수
  function startGpsRecording() {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported on this device.');
      return;
    }

    setIsGpsRecording(true);
    setGpsError(null);
    setSaveStatus('📍 GPS Field Tracking Active...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentCoord: LatLngTuple = [position.coords.latitude, position.coords.longitude];
        setGpsAccuracy(Math.round(position.coords.accuracy));

        // Jittering 방지: 마지막 포인트에서 최소 3m 이상 이동 시에만 포인트 추가
        if (lastPointRef.current) {
          const distanceKm = calculateHaversineDistanceKm(lastPointRef.current, currentCoord);
          if (distanceKm < 0.003) {
            return;
          }
        }

        lastPointRef.current = currentCoord;
        setRoutePoints((prev) => [...prev, currentCoord]);
      },
      (error) => {
        setGpsError(error.message);
        setSaveStatus(`GPS error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );
  }

  // 실시간 GPS 기록 정지 함수
  function stopGpsRecording() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsRecording(false);
    lastPointRef.current = null;
    setSaveStatus('GPS Tracking stopped.');
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
    setSaveStatus('');
  }

  // 코스 저장 및 종료
  async function saveCourse() {
    if (isGpsRecording) {
      stopGpsRecording();
    }

    if (routePoints.length < 2) {
      setSaveStatus('⚠️ 최소 2개 이상의 포인트가 필요합니다.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving course...');
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
        setSaveStatus(`✅ 코스 수정 완료: ${id}`);
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
        setSaveStatus(`✅ 새 코스 저장 완료: ${id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save error.';
      setSaveStatus(
        isSupabaseConfigured
          ? `❌ DB 저장 실패: ${message}`
          : '⚠️ 로컬 저장만 완료 (Supabase 설정 확인 필요)'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 풀스크린 지도 (Step 2) */}
      <div className="absolute inset-0 z-0">
        <CourseBuilderMap
          center={routePoints.length > 0 ? routePoints[routePoints.length - 1] : selectedArea.mapCenter}
          routePoints={routePoints}
          checkpoints={checkpoints}
          onAddRoutePoint={addRoutePoint}
          onMoveRoutePoint={moveRoutePoint}
          onDeleteRoutePoint={deleteRoutePoint}
        />
        {/* 비네팅 가독성 오버레이 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
      </div>

      {/* 2. 상단 모바일 HUD 헤더 (코스 설정 및 정보) */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 pb-2">
        <div className="max-w-lg mx-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-3 shadow-2xl shadow-black/80 flex flex-col gap-2">
          {/* 상단 라인: 뒤로가기 & 코스명 & 상태 */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white shrink-0"
            >
              ← 나가기
            </button>

            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="코스 이름 입력"
              className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-100 placeholder-slate-500 outline-none focus:border-teal-400"
            />

            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
              isGpsRecording 
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse' 
                : 'bg-teal-950 text-teal-300 border border-teal-500/40'
            }`}>
              {isGpsRecording ? '🔴 REC' : 'READY'}
            </span>
          </div>

          {/* 하단 라인: 지역, 난이도, 실시간 지표 */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 gap-2">
            <div className="flex items-center gap-1.5">
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-200"
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
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            {/* 실시간 수집 지표 */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">
                P: <strong className="text-slate-100 font-bold">{routePoints.length}</strong>
              </span>
              <span className="text-teal-400 font-bold">
                {routeDistanceKm.toFixed(2)} km
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. 우측 상단 플로팅 퀵 툴즈 (수동 조작용) */}
      <aside className="absolute right-3 top-32 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={undoLastPoint}
          disabled={routePoints.length === 0}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-black shadow-lg flex items-center justify-center active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          title="마지막 포인트 취소"
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={clearRoute}
          disabled={routePoints.length === 0}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-rose-400 text-xs font-black shadow-lg flex items-center justify-center active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          title="전체 초기화"
        >
          🗑️
        </button>
      </aside>

      {/* 4. 하단 모바일 플로팅 제어 액션바 (Step 2) */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-6 pt-2">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {/* 상태/에러 메시지 토스트 */}
          {(saveStatus || gpsError) && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-center text-xs font-bold text-teal-300 shadow-xl">
              {saveStatus || gpsError} {gpsAccuracy !== null && `(±${gpsAccuracy}m)`}
            </div>
          )}

          {/* 대형 제어 버튼 그룹 */}
          <div className="grid grid-cols-2 gap-2.5">
            {!isGpsRecording ? (
              <button
                type="button"
                onClick={startGpsRecording}
                className="py-4 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <span className="text-lg">▶️</span>
                <span>코스 기록 시작</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopGpsRecording}
                className="py-4 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-amber-300/50 animate-pulse"
              >
                <span className="text-lg">⏸️</span>
                <span>기록 일시정지</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void saveCourse()}
              disabled={routePoints.length < 2 || isSaving || isLoadingCourse}
              className="py-4 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-cyan-300/40 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="text-lg">⏹️</span>
              <span>{isSaving ? '저장 중...' : '기록 종료 및 저장'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
