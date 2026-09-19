import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CourseBuilderMap from '../components/CourseBuilderMap';
import WearableSyncModal from '../components/wearable/WearableSyncModal';
import { mockAreas } from '../data/mockAreas';
import type { LatLngTuple } from '../types/area';
import type { Course, CourseCheckpoint, Difficulty } from '../types/course';
import type { CompletedActivitySummary } from '../types/activity';
import {
  getCourseById,
  saveRouteAsCourse,
  updateCourse,
  type CourseArea
} from '../services/courseService';
import { snapToRoad } from '../services/mapMatchingService';
import { calculateHaversineDistanceKm, calculateRouteDistanceKm } from '../utils/route';
import { GpsKalmanFilter, isGpsOutlier } from '../utils/gpsSmoothing';
import { completeActivityProgress } from '../utils/gameProgress';
import { recordExplorationDistance, saveExploredBreadcrumbs } from '../utils/fogOfWar';
import { buildOptimizedCheckpoints } from '../utils/pathSimplification';

const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Challenge'];
type BuilderState = 'idle' | 'recording' | 'paused' | 'matching' | 'reviewing';

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
  return buildOptimizedCheckpoints(routePoints);
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
  const location = useLocation();
  const { courseId } = useParams();

  // 기본 설정 (자유 러닝이 주 목적)
  const [courseName, setCourseName] = useState(() => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    return `자유 러닝 (${dateStr})`;
  });
  const [areaId, setAreaId] = useState(mockAreas[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [routePoints, setRoutePoints] = useState<LatLngTuple[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCourseCreatorSection, setShowCourseCreatorSection] = useState(false);
  const [showGpxModal, setShowGpxModal] = useState(false);

  // 워크플로우 상태 머신 (idle | recording | paused | matching | reviewing)
  const [builderState, setBuilderState] = useState<BuilderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userLivePosition, setUserLivePosition] = useState<LatLngTuple | null>(null);

  // 🛰️ 고성능 칼만 필터 및 트래킹 참조 변수
  const kalmanFilterRef = useRef(new GpsKalmanFilter(2.5));
  const watchIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const lastPointRef = useRef<LatLngTuple | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const lastPositionTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const selectedArea = mockAreas.find((area) => area.id === areaId) ?? mockAreas[0];
  const checkpoints = useMemo(() => buildCheckpoints(routePoints), [routePoints]);
  const routeDistanceKm = useMemo(() => calculateRouteDistanceKm(routePoints), [routePoints]);
  const estimatedXp = Math.max(50, Math.round(routeDistanceKm * 120) + 30);
  const estimatedCalories = Math.max(10, Math.round(routeDistanceKm * 65));

  // 평균 페이스 계산
  const avgPaceFormatted = useMemo(() => {
    if (routeDistanceKm <= 0.05 || elapsedSeconds <= 0) return "--'--\"";
    const secPerKm = elapsedSeconds / routeDistanceKm;
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = Math.floor(secPerKm % 60);
    if (paceMin > 30) return "--'--\"";
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
  }, [routeDistanceKm, elapsedSeconds]);

  // 1. 화면 꺼짐 방지 (Wake Lock)
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

  // 2. 초기 로드 시 유저의 실시간 위치 미리 탐색
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const rawCoord: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        const filteredCoord = kalmanFilterRef.current.filter(rawCoord[0], rawCoord[1], pos.coords.accuracy);
        setUserLivePosition(filteredCoord);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      () => {
        // 위치 실패 시 기본 지역 중심 유지
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  // 3. 타이머 로직 (기록 중일 때 매초 증가)
  useEffect(() => {
    if (builderState !== 'recording') return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [builderState]);

  // 4. 기존 코스 수정 모드일 때 로드
  useEffect(() => {
    let isMounted = true;

    // A. 이전 화면에서 전달된 GPX 데이터가 있는 경우
    const navState = location.state as { importedRoutePoints?: LatLngTuple[]; courseName?: string } | null;
    if (navState?.importedRoutePoints && navState.importedRoutePoints.length > 0) {
      setRoutePoints(navState.importedRoutePoints);
      if (navState.courseName) setCourseName(navState.courseName);
      setUserLivePosition(navState.importedRoutePoints[0]);
      setBuilderState('reviewing');
      setSaveStatus(`⌚ 워치 데이터 (${navState.importedRoutePoints.length}P) 불러오기 완료!`);
      return;
    }

    async function loadEditableCourse() {
      if (!courseId) return;

      try {
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
        setShowCourseCreatorSection(true);
        setBuilderState('reviewing');
        setSaveStatus(`코스 수정 모드: ${editableCourse.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '불러오기 실패';
        setSaveStatus(`에러: ${message}`);
      }
    }

    loadEditableCourse();
    return () => {
      isMounted = false;
    };
  }, [courseId, location.state]);

  // 5. GPS 원시 데이터 처리 파이프라인 (칼만 필터 + 이상치 제거 + 거리 누적)
  function processIncomingGpsPosition(pos: GeolocationPosition) {
    const accuracy = Math.round(pos.coords.accuracy);
    const nowMs = Date.now();
    const rawCoord: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
    setGpsAccuracy(accuracy);
    setGpsError(null);

    // 1. 칼만 필터 스무딩
    const filteredCoord = kalmanFilterRef.current.filter(rawCoord[0], rawCoord[1], accuracy, nowMs);
    setUserLivePosition(filteredCoord);

    // 기록 중이 아닐 때는 마커 위치만 갱신
    if (builderState !== 'recording') {
      return;
    }

    // 2. 속도 계산
    if (pos.coords.speed !== null && pos.coords.speed >= 0) {
      setCurrentSpeedKmh(Number((pos.coords.speed * 3.6).toFixed(1)));
    } else if (lastPointRef.current) {
      const deltaKm = calculateHaversineDistanceKm(lastPointRef.current, filteredCoord);
      const deltaHours = (nowMs - lastPositionTimeRef.current) / 1000 / 3600;
      if (deltaHours > 0) {
        setCurrentSpeedKmh(Number(Math.min(35, deltaKm / deltaHours).toFixed(1)));
      }
    }
    lastPositionTimeRef.current = nowMs;

    // 3. 최초 지점 등록 (Start Point)
    if (!lastPointRef.current || routePoints.length === 0) {
      lastPointRef.current = filteredCoord;
      lastSavedTimeRef.current = nowMs;
      setRoutePoints([filteredCoord]);
      setSaveStatus('🟢 출발 지점 확인! 자유롭게 달리세요.');
      return;
    }

    // 4. 이상치 필터
    const timeDiffSec = (nowMs - lastSavedTimeRef.current) / 1000;
    if (isGpsOutlier(filteredCoord, lastPointRef.current, timeDiffSec, accuracy)) {
      return;
    }

    const distanceMovedKm = calculateHaversineDistanceKm(lastPointRef.current, filteredCoord);

    // 5. 이동 조건 판별 (2.5m 이상 이동 시 궤적 추가)
    if (distanceMovedKm >= 0.0025 || (timeDiffSec >= 4 && distanceMovedKm >= 0.0015)) {
      lastPointRef.current = filteredCoord;
      lastSavedTimeRef.current = nowMs;
      setRoutePoints((prev) => [...prev, filteredCoord]);
      setSaveStatus(`🏃 운동 기록 중... (${(routeDistanceKm + distanceMovedKm).toFixed(2)}km)`);
    }
  }

  // 6. 하이브리드 GPS 트래킹 시작 (watchPosition + 3초 폴백 Heartbeat)
  function startWorkoutTracking() {
    if (!('geolocation' in navigator)) {
      setGpsError('위치 서비스를 지원하지 않는 브라우저입니다.');
      return;
    }

    void requestWakeLock();
    setBuilderState('recording');
    setGpsError(null);
    setSaveStatus('🛰️ GPS 연결 중... 실시간 이동 경로를 기록합니다.');
    lastSavedTimeRef.current = Date.now();
    lastPositionTimeRef.current = Date.now();

    // 1단계: 즉시 현재 위치 단발성 락 요청
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processIncomingGpsPosition(pos);
      },
      (err) => {
        console.warn('Initial GPS lock delay:', err.message);
        setSaveStatus(`🛰️ GPS 신호 수신 대기 중 (신호 찾는 중...)`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2단계: 연속 위치 감시 (watchPosition)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        processIncomingGpsPosition(pos);
      },
      (err) => {
        console.warn('watchPosition warning:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1500 }
    );

    // 3단계: 안드로이드 브라우저 잠자기 방지 3초 Heartbeat Interval
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          processIncomingGpsPosition(pos);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 2000 }
      );
    }, 3500);
  }

  // 7. 일시정지 / 재개
  function pauseWorkoutTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setBuilderState('paused');
    setCurrentSpeedKmh(0);
    setSaveStatus('⏸️ 운동이 일시 정지되었습니다.');
  }

  function resumeWorkoutTracking() {
    startWorkoutTracking();
  }

  // 8. 운동 종료 및 도로망 자동 오버랩 매칭 후 리뷰 모드 진입
  async function finishWorkout() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    void releaseWakeLock();
    setCurrentSpeedKmh(0);

    if (routePoints.length >= 2) {
      setBuilderState('matching');
      setSaveStatus('🛣️ GPS 궤적을 지도 도로망에 정밀 매칭하는 중...');
      try {
        const matchResult = await snapToRoad(routePoints);
        if (matchResult.matchedPoints && matchResult.matchedPoints.length >= 2) {
          setRoutePoints(matchResult.matchedPoints);
        }
        setBuilderState('reviewing');
        setSaveStatus('✨ 도로망 매칭 완료! 도로 중심선에 깔끔하게 오버랩되었습니다.');
      } catch (err) {
        console.warn('Map matching on finish error:', err);
        setBuilderState('reviewing');
        setSaveStatus('🏁 운동이 종료되었습니다! 오늘의 운동 기록을 확인하고 저장하세요.');
      }
    } else {
      setBuilderState('reviewing');
      setSaveStatus('🏁 운동이 종료되었습니다! 오늘의 운동 기록을 확인하고 저장하세요.');
    }
  }

  // 9. 전체 초기화
  function resetAll() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    void releaseWakeLock();
    setRoutePoints([]);
    setElapsedSeconds(0);
    setCurrentSpeedKmh(0);
    setBuilderState('idle');
    setSaveStatus('');
    lastPointRef.current = null;
    kalmanFilterRef.current.reset();
  }

  // 10. 🏆 주 목적: [당일 운동 기록 저장] (Save Daily Activity)
  async function handleSaveDailyWorkout() {
    if (routeDistanceKm < 0.05 && elapsedSeconds < 10) {
      setSaveStatus('⚠️ 최소 50m 이상 이동해야 운동 기록이 저장됩니다.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('오늘의 운동 기록을 저장하고 경험치를 반영하는 중...');

    try {
      const freeCourse: Course = {
        id: `free-run-${Date.now()}`,
        areaId: selectedArea.id,
        areaName: selectedArea.name,
        name: courseName.trim() || '오늘의 자유 러닝',
        description: '자유 러닝 당일 운동 기록',
        courseType: 'running',
        distanceKm: Math.max(0.1, Number(routeDistanceKm.toFixed(2))),
        estimatedTimeMin: Math.max(1, Math.ceil(elapsedSeconds / 60)),
        difficulty: 'Easy',
        xpReward: estimatedXp,
        explorationReward: Math.max(1, Math.round(routeDistanceKm * 3)),
        startPoint: routePoints[0] ?? selectedArea.mapCenter,
        finishPoint: routePoints[routePoints.length - 1] ?? selectedArea.mapCenter,
        routeCoordinates: routePoints,
        checkpoints: buildCheckpoints(routePoints),
        pois: [],
        safetyNotes: ''
      };

      const summary: CompletedActivitySummary = {
        activityId: `act-free-${Date.now()}`,
        courseId: freeCourse.id,
        courseName: freeCourse.name,
        areaName: selectedArea.name,
        difficulty: 'Easy',
        distanceKm: Number(routeDistanceKm.toFixed(2)),
        durationSeconds: elapsedSeconds
      };

      // 1. 캐릭터 레벨업 및 XP 기록
      completeActivityProgress(freeCourse, summary);

      // 2. Fog of War 지도 개척 반영
      if (routePoints.length > 0) {
        saveExploredBreadcrumbs(routePoints);
        recordExplorationDistance(selectedArea.id, Number(routeDistanceKm.toFixed(2)));
      }

      setSaveStatus(`🎉 저장 완료! +${estimatedXp} XP 획득! 1초 후 대시보드로 이동합니다.`);

      setTimeout(() => {
        navigate('/character-dashboard');
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장 실패';
      setSaveStatus(`❌ 저장 오류: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // 11. 🛣️ 부수 기능: [이 경로를 공식 코스로 등록하기] (Map Matching & Course Publish)
  async function handlePublishAsCourse() {
    if (routePoints.length < 2) {
      setSaveStatus('⚠️ 최소 2개 이상의 위치 포인트가 필요합니다.');
      return;
    }

    setBuilderState('matching');
    setSaveStatus('🛣️ GPS 궤적을 도로망에 맞게 정밀 교정하는 중 (OSRM)...');

    try {
      const matchResult = await snapToRoad(routePoints);
      const finalPoints = matchResult.matchedPoints.length >= 2 ? matchResult.matchedPoints : routePoints;
      setRoutePoints(finalPoints);

      setIsSaving(true);
      setSaveStatus('코스 데이터베이스에 저장 중...');
      const databaseArea = toDatabaseArea(selectedArea.name);
      const distance = calculateRouteDistanceKm(finalPoints);

      if (courseId) {
        const id = await updateCourse(
          {
            id: courseId,
            name: courseName.trim() || 'My Custom Route',
            area: databaseArea,
            difficulty,
            distance
          },
          finalPoints
        );
        setSaveStatus(`✨ 코스 수정 완료! 코스 상세 페이지로 이동합니다.`);
        setTimeout(() => navigate(`/courses/${id}`), 1000);
      } else {
        const id = await saveRouteAsCourse(
          {
            name: courseName.trim() || 'My Custom Route',
            area: databaseArea,
            difficulty,
            distance
          },
          finalPoints
        );
        setSaveStatus(`✨ 새 공식 코스 등록 완료! 코스 상세 페이지로 이동합니다.`);
        setTimeout(() => navigate(`/courses/${id}`), 1000);
      }
    } catch {
      setBuilderState('reviewing');
      setSaveStatus('⚠️ 도로 매칭 실패. 원본 경로로 다시 검토합니다.');
    } finally {
      setIsSaving(false);
    }
  }

  // 화면 정리
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
      }
      void releaseWakeLock();
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 배경: 풀스크린 지도 (100vh) */}
      <div className="absolute inset-0 z-0">
        <CourseBuilderMap
          center={userLivePosition ?? (routePoints.length > 0 ? routePoints[routePoints.length - 1] : selectedArea.mapCenter)}
          userLivePosition={userLivePosition}
          isTracking={builderState === 'recording'}
          routePoints={routePoints}
          checkpoints={checkpoints}
          onAddRoutePoint={(point) => {
            setRoutePoints((prev) => [...prev, point]);
          }}
          onMoveRoutePoint={(index, point) => {
            setRoutePoints((prev) => prev.map((p, i) => (i === index ? point : p)));
          }}
          onDeleteRoutePoint={(index) => {
            setRoutePoints((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      </div>

      {/* 2. 상단 네비게이션 & 실시간 상태 배지 */}
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

        {/* 상단 우측 둥근 GPS 상태 배지 */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-black/10 text-xs font-bold text-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  builderState === 'recording' ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  builderState === 'recording' ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            </span>
            <span className="font-extrabold tracking-tight">
              {builderState === 'recording' ? 'GPS Active' : 'GPS Standby'}
            </span>
            {gpsAccuracy !== null && (
              <span
                className={`text-[10px] font-mono font-black ${
                  gpsAccuracy <= 15 ? 'text-emerald-600' : gpsAccuracy <= 35 ? 'text-amber-600' : 'text-rose-500'
                }`}
              >
                ±{gpsAccuracy}m
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 3. 우측 플로팅 퀵 툴 (워치 불러오기 / 테스트 시뮬레이션 / 되돌리기 / 초기화) */}
      <aside className="absolute right-4 top-20 z-20 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setShowGpxModal(true)}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg flex items-center justify-center active:scale-90 transition-all text-xs"
          title="스마트워치 GPX 파일 불러오기"
        >
          ⌚
        </button>
        <button
          type="button"
          onClick={() => {
            const mockBgcTrack: LatLngTuple[] = [
              [14.5492, 121.0505],
              [14.551, 121.052],
              [14.5528, 121.0545],
              [14.554, 121.0532],
              [14.5522, 121.051],
              [14.5505, 121.049]
            ];
            setRoutePoints(mockBgcTrack);
            setElapsedSeconds(320);
            setUserLivePosition(mockBgcTrack[mockBgcTrack.length - 1]);
            setSaveStatus('🧪 테스트 궤적 6개가 주입되었습니다! [⏹️ 운동 종료]를 눌러보세요.');
          }}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-violet-200 text-violet-700 font-black shadow-lg flex items-center justify-center active:scale-90 transition-all text-xs"
          title="테스트 궤적 주입"
        >
          🧪
        </button>
        <button
          type="button"
          onClick={() => setRoutePoints((prev) => prev.slice(0, -1))}
          disabled={routePoints.length === 0 || builderState === 'recording'}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 font-bold shadow-lg flex items-center justify-center active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="마지막 포인트 취소"
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={resetAll}
          disabled={routePoints.length === 0 && elapsedSeconds === 0 && builderState === 'idle'}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-rose-500 font-bold shadow-lg flex items-center justify-center active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
          title="전체 초기화"
        >
          🗑️
        </button>
      </aside>

      {/* 4. 하단 모던 컨트롤 바텀시트 */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white text-slate-900 rounded-t-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.15)] px-6 pt-5 pb-7 transition-all duration-300">
        <div className="max-w-md mx-auto flex flex-col">
          {/* 바텀시트 상단 드래그 핸들 */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

          {/* ======================================================= */}
          {/* 상태 A: 도로망 매칭 중 (matching)                         */}
          {/* ======================================================= */}
          {builderState === 'matching' ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <span className="text-sm font-black text-slate-800 animate-pulse">
                🛣️ 도로망에 경로를 정밀 교정하는 중...
              </span>
            </div>
          ) : builderState === 'reviewing' ? (
            /* ======================================================= */
            /* 상태 B: 🏆 운동 완료 및 저장 화면 (Reviewing)           */
            /* ======================================================= */
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-center">
                <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                  🏁 Workout Finished (운동 완료)
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">이동 거리</span>
                    <span className="text-lg font-black text-slate-900">{routeDistanceKm.toFixed(2)} km</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">운동 시간</span>
                    <span className="text-lg font-black text-slate-900">{formatElapsedTime(elapsedSeconds)}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">보상 XP</span>
                    <span className="text-lg font-black text-amber-500">+{estimatedXp} XP</span>
                  </div>
                </div>
              </div>

              {/* 🌟 주 기능: [당일 운동 기록 저장] */}
              <button
                type="button"
                onClick={() => void handleSaveDailyWorkout()}
                disabled={isSaving}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>🎉</span>
                <span>{isSaving ? '저장 중...' : `당일 운동 기록 저장하기 (+${estimatedXp} XP)`}</span>
              </button>

              {/* 🛠️ 부수 기능: [이 경로를 정식 코스로 등록] 토글 */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseCreatorSection((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>이 경로를 새 공식 코스로 등록하기 (옵션)</span>
                  </span>
                  <span>{showCourseCreatorSection ? '▲ 접기' : '▼ 펼치기'}</span>
                </button>

                {showCourseCreatorSection && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col gap-2.5 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="코스 이름 (예: BGC 나이트 런)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500"
                    />

                    <div className="flex gap-2">
                      <select
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
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
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-amber-600"
                      >
                        {difficulties.map((diff) => (
                          <option key={diff} value={diff}>
                            {diff}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handlePublishAsCourse()}
                      disabled={isSaving}
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-md shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>🛣️</span>
                      <span>도로망 매칭 후 공식 코스로 등록</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 다시 기록하기 버튼 */}
              <button
                type="button"
                onClick={resetAll}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ 기록 취소 및 새로 시작
              </button>
            </div>
          ) : (
            /* ======================================================= */
            /* 상태 C: 🏃 실시간 자유 운동 기록 화면 (Idle / Recording)  */
            /* ======================================================= */
            <>
              {/* 패널 상단: 타이머 & 원형 액션 컨트롤 */}
              <div className="flex items-center justify-between gap-4">
                {/* 시간 표시 */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {builderState === 'recording'
                      ? '🔴 REC TIME'
                      : builderState === 'paused'
                      ? '⏸️ PAUSED'
                      : 'FREE RUN TIME'}
                  </span>
                  <span className="text-4xl font-black tracking-tight text-slate-900 tabular-nums">
                    {formatElapsedTime(elapsedSeconds)}
                  </span>
                </div>

                {/* 우측 원형 컨트롤 버튼들 */}
                <div className="flex items-center gap-2.5">
                  {builderState === 'idle' ? (
                    <button
                      type="button"
                      onClick={startWorkoutTracking}
                      className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center text-2xl transition-all duration-200 border-2 border-emerald-300/40"
                      title="운동 시작"
                    >
                      ▶️
                    </button>
                  ) : builderState === 'recording' ? (
                    <>
                      <button
                        type="button"
                        onClick={pauseWorkoutTracking}
                        className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center text-xl transition-all border-2 border-amber-300/40 animate-pulse"
                        title="일시정지"
                      >
                        ⏸️
                      </button>
                      <button
                        type="button"
                        onClick={finishWorkout}
                        className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-lg flex items-center justify-center text-xl transition-all"
                        title="운동 종료"
                      >
                        ⏹️
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={resumeWorkoutTracking}
                        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center text-xl transition-all"
                        title="재개"
                      >
                        ▶️
                      </button>
                      <button
                        type="button"
                        onClick={finishWorkout}
                        className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-lg flex items-center justify-center text-xl transition-all"
                        title="운동 종료"
                      >
                        ⏹️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 4칸 스탯 그리드: 거리 / 속도 / 페이스 / 칼로리 */}
              <div className="grid grid-cols-4 gap-1.5 pt-4 mt-4 border-t border-slate-100 text-center">
                {/* 1. 거리 */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">거리</span>
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {routeDistanceKm.toFixed(2)}
                    <span className="text-[10px] font-semibold text-slate-500 ml-0.5">km</span>
                  </span>
                </div>

                {/* 2. 현재 속도 */}
                <div className="flex flex-col items-center border-l border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">속도</span>
                  <span className="text-lg font-black text-teal-600 tabular-nums">
                    {currentSpeedKmh.toFixed(1)}
                    <span className="text-[10px] font-semibold text-slate-500 ml-0.5">km/h</span>
                  </span>
                </div>

                {/* 3. 페이스 */}
                <div className="flex flex-col items-center border-l border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">페이스</span>
                  <span className="text-lg font-black text-indigo-600 tabular-nums text-xs sm:text-base">
                    {avgPaceFormatted}
                  </span>
                </div>

                {/* 4. 칼로리 */}
                <div className="flex flex-col items-center border-l border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">칼로리</span>
                  <span className="text-lg font-black text-amber-500 tabular-nums">
                    {estimatedCalories}
                    <span className="text-[10px] font-semibold text-slate-500 ml-0.5">kcal</span>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 상태/에러 안내 바 */}
          {(saveStatus || gpsError) && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-700">
              {saveStatus || gpsError}
            </div>
          )}
        </div>
      </footer>

      {/* ⌚ 스마트워치 클라우드 자동 동기화 & GPX 모달 */}
      <WearableSyncModal
        isOpen={showGpxModal}
        onClose={() => setShowGpxModal(false)}
        onSyncSuccess={() => {
          setSaveStatus(`⌚ 워치 데이터 자동 동기화 완료!`);
        }}
      />
    </div>
  );
}
