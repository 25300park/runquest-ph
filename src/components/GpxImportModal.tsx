import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Polyline, TileLayer } from 'react-leaflet';
import { parseGpxOrTcx, type ParsedWorkoutData } from '../utils/gpxParser';
import { completeActivityProgress } from '../utils/gameProgress';
import { recordExplorationDistance, saveExploredBreadcrumbs } from '../utils/fogOfWar';
import type { Course } from '../types/course';
import type { CompletedActivitySummary } from '../types/activity';

interface GpxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (data: ParsedWorkoutData) => void;
}

// 테스트용 BGC 나이트런 샘플 GPX XML
const SAMPLE_GPX_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="Samsung Galaxy Watch 6" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <name>BGC High Street Night Run (3.2km)</name>
    <trkseg>
      <trkpt lat="14.5503" lon="121.0507"><ele>24.5</ele><time>2026-09-19T11:00:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>138</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="14.5518" lon="121.0525"><ele>25.1</ele><time>2026-09-19T11:03:20Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>149</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="14.5535" lon="121.0548"><ele>26.0</ele><time>2026-09-19T11:07:10Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>158</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="14.5548" lon="121.0536"><ele>25.8</ele><time>2026-09-19T11:11:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>162</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="14.5529" lon="121.0512"><ele>24.9</ele><time>2026-09-19T11:15:30Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>154</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="14.5505" lon="121.0492"><ele>24.2</ele><time>2026-09-19T11:19:15Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>145</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>
    </trkseg>
  </trk>
</gpx>`;

export default function GpxImportModal({ isOpen, onClose, onImportSuccess }: GpxImportModalProps) {
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState<ParsedWorkoutData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleFileUpload(file: File) {
    setErrorMessage(null);
    setSuccessStatus(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('파일을 읽을 수 없습니다.');
        const result = parseGpxOrTcx(text, file.name);
        setParsedData(result);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'GPX 파싱에 실패했습니다.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('파일을 읽어오는 중 오류가 발생했습니다.');
    };

    reader.readAsText(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function loadSampleGpx() {
    setErrorMessage(null);
    setSuccessStatus(null);
    try {
      const result = parseGpxOrTcx(SAMPLE_GPX_CONTENT, 'samsung_galaxy_watch_bgc.gpx');
      setParsedData(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '샘플 데이터 로드 실패');
    }
  }

  // 1. 당일 운동으로 즉시 반영 (Save Daily Workout)
  function handleApplyAsDailyWorkout() {
    if (!parsedData) return;
    setIsProcessing(true);

    try {
      const freeCourse: Course = {
        id: `gpx-run-${Date.now()}`,
        areaId: 'area-bgc',
        areaName: 'Bonifacio Global City',
        name: parsedData.title,
        description: `${parsedData.sourceDevice} 연동 운동 기록`,
        courseType: 'running',
        distanceKm: parsedData.distanceKm,
        estimatedTimeMin: Math.ceil(parsedData.durationSeconds / 60),
        difficulty: 'Easy',
        xpReward: parsedData.estimatedXp,
        explorationReward: Math.max(1, Math.round(parsedData.distanceKm * 3)),
        startPoint: parsedData.routeCoordinates[0] ?? [14.5503, 121.0507],
        finishPoint: parsedData.routeCoordinates[parsedData.routeCoordinates.length - 1] ?? [14.5503, 121.0507],
        routeCoordinates: parsedData.routeCoordinates,
        checkpoints: [],
        pois: [],
        safetyNotes: ''
      };

      const summary: CompletedActivitySummary = {
        activityId: `act-gpx-${Date.now()}`,
        courseId: freeCourse.id,
        courseName: freeCourse.name,
        areaName: 'Bonifacio Global City',
        difficulty: 'Easy',
        distanceKm: parsedData.distanceKm,
        durationSeconds: parsedData.durationSeconds
      };

      // 1. 경험치 및 레벨업 지급
      completeActivityProgress(freeCourse, summary);

      // 2. Fog of War 안개 개척
      if (parsedData.routeCoordinates.length > 0) {
        saveExploredBreadcrumbs(parsedData.routeCoordinates);
        recordExplorationDistance('area-bgc', parsedData.distanceKm);
      }

      setSuccessStatus(`🎉 ${parsedData.distanceKm}km 운동 반영 완료! +${parsedData.estimatedXp} XP 획득!`);
      if (onImportSuccess) onImportSuccess(parsedData);

      setTimeout(() => {
        onClose();
        navigate('/character-dashboard');
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '운동 기록 저장 실패');
    } finally {
      setIsProcessing(false);
    }
  }

  // 2. 코스 제작 페이지로 보내기
  function handleSendToCourseBuilder() {
    if (!parsedData) return;
    if (onImportSuccess) onImportSuccess(parsedData);
    onClose();
    navigate('/course-builder', {
      state: {
        importedRoutePoints: parsedData.routeCoordinates,
        courseName: parsedData.title,
        distanceKm: parsedData.distanceKm
      }
    });
  }

  const mapCenter = parsedData?.routeCoordinates[0] ?? [14.5503, 121.0507];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* 상단 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⌚</span>
            <div>
              <h3 className="font-black text-sm">스마트워치 운동 데이터 가져오기</h3>
              <p className="text-[11px] text-slate-300">삼성/애플/가민/샤오미/나이키 GPX 파일 연동</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* 지원 기기 배지 리스트 */}
          <div className="flex flex-wrap items-center gap-1.5 justify-center py-1">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              ⌚ Galaxy Watch
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              🍏 Apple Watch
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              🔴 Garmin
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              🟠 Xiaomi Mi
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              ⚡ Nike NRC
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              🟧 Strava
            </span>
          </div>

          {/* 파일 업로드 드롭존 */}
          {!parsedData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-inner">
                📁
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">
                  스마트워치 GPX 또는 TCX 파일을 드래그하거나 선택하세요
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  삼성헬스, 미피트니스, 가민 커넥트의 [GPX 내보내기] 파일
                </p>
              </div>

              <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/25 cursor-pointer active:scale-95 transition-all">
                파일 선택하기
                <input
                  type="file"
                  accept=".gpx,.tcx,application/gpx+xml,application/xml,text/xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* 샘플 데이터 테스트 버튼 */}
              <button
                type="button"
                onClick={loadSampleGpx}
                className="text-[11px] font-bold text-indigo-600 hover:underline pt-2"
              >
                🧪 샘플 워치 데이터(BGC 3.2km) 즉시 불러와서 테스트하기
              </button>
            </div>
          ) : (
            /* 파싱 결과 대시보드 */
            <div className="space-y-3 animate-in zoom-in-95 duration-200">
              {/* 디바이스 배지 & 제목 */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center gap-1">
                  <span>📱</span> {parsedData.sourceDevice}
                </span>
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  다른 파일 선택
                </button>
              </div>

              <h4 className="font-black text-sm text-slate-900">{parsedData.title}</h4>

              {/* 4칸 스탯 그리드 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">거리</span>
                  <span className="text-sm font-black text-slate-900">{parsedData.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">시간</span>
                  <span className="text-sm font-black text-slate-900">
                    {Math.floor(parsedData.durationSeconds / 60)}분 {parsedData.durationSeconds % 60}초
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">페이스</span>
                  <span className="text-sm font-black text-indigo-600">{parsedData.avgPaceMinKm}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">보상</span>
                  <span className="text-sm font-black text-amber-500">+{parsedData.estimatedXp} XP</span>
                </div>
              </div>

              {/* 심박수 & 고도 보너스 정보 */}
              {(parsedData.avgHeartRate !== null || parsedData.elevationGainMeters > 0) && (
                <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                  {parsedData.avgHeartRate !== null && (
                    <span className="font-black text-rose-600 flex items-center gap-1">
                      <span>❤️</span> 평균 심박: {parsedData.avgHeartRate} BPM
                      {parsedData.avgHeartRate >= 145 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-md text-[10px]">
                          버닝 +50 XP
                        </span>
                      )}
                    </span>
                  )}
                  {parsedData.elevationGainMeters > 0 && (
                    <span className="font-bold text-slate-600">
                      ⛰️ 고도: +{parsedData.elevationGainMeters}m
                    </span>
                  )}
                </div>
              )}

              {/* 미니 지도 프리뷰 */}
              <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 relative">
                <MapContainer center={mapCenter} zoom={14} zoomControl={false} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polyline
                    positions={parsedData.routeCoordinates}
                    pathOptions={{ color: '#6366f1', weight: 5, opacity: 0.9 }}
                  />
                </MapContainer>
              </div>

              {/* 메인 액션 버튼 그룹 */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleApplyAsDailyWorkout}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>🎉</span>
                  <span>
                    {isProcessing ? '저장 중...' : `당일 운동으로 반영하기 (+${parsedData.estimatedXp} XP 획득)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToCourseBuilder}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>✨</span>
                  <span>이 궤적으로 새 코스 제작/편집하기</span>
                </button>
              </div>
            </div>
          )}

          {/* 에러 및 성공 상태 알림 */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
              ⚠️ {errorMessage}
            </div>
          )}
          {successStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center animate-bounce">
              {successStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
