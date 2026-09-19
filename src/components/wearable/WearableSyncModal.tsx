import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Polyline, TileLayer } from 'react-leaflet';
import {
  getWearableConnections,
  toggleWearableConnection,
  getSyncedWearableActivities,
  simulateSmartwatchAutoSync,
  type WearableConnection,
  type WearableProvider,
  type SyncedWearableActivity
} from '../../services/wearableSyncService';
import { parseGpxOrTcx, type ParsedWorkoutData } from '../../utils/gpxParser';
import { completeActivityProgress } from '../../utils/gameProgress';
import { recordExplorationDistance, saveExploredBreadcrumbs } from '../../utils/fogOfWar';
import type { Course } from '../../types/course';
import type { CompletedActivitySummary } from '../../types/activity';

interface WearableSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

type TabType = 'auto' | 'manual' | 'history';

// 테스트용 BGC 나이트런 샘플 GPX
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

export default function WearableSyncModal({ isOpen, onClose, onSyncSuccess }: WearableSyncModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('auto');
  const [connections, setConnections] = useState<Record<WearableProvider, WearableConnection>>(() => getWearableConnections());
  const [syncedActivities, setSyncedActivities] = useState<SyncedWearableActivity[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 수동 GPX 파일 파싱 상태
  const [manualParsedData, setManualParsedData] = useState<ParsedWorkoutData | null>(null);
  const [isManualProcessing, setIsManualProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConnections(getWearableConnections());
      void loadHistory();
    }
  }, [isOpen]);

  async function loadHistory() {
    const list = await getSyncedWearableActivities();
    setSyncedActivities(list);
  }

  if (!isOpen) return null;

  // 1. 프로바이더 연동 토글
  function handleToggleConnection(provider: WearableProvider) {
    const currentState = connections[provider]?.isConnected ?? false;
    const next = toggleWearableConnection(provider, !currentState);
    setConnections(next);
    setStatusMessage(
      !currentState
        ? `✅ ${next[provider].name} 연동 완료! 다음 러닝부터 자동 동기화됩니다.`
        : `⚠️ ${next[provider].name} 연동이 해제되었습니다.`
    );
  }

  // 2. 🧪 워치 3.8km 완주 이벤트 자동 전송 시뮬레이션
  async function handleSimulateAutoSync(provider: WearableProvider, deviceName: string) {
    setIsSimulating(true);
    setStatusMessage(`⌚ [${deviceName}] 운동 세션 종료 감지... 클라우드 DB로 전송 중...`);

    try {
      const activity = await simulateSmartwatchAutoSync(provider, deviceName);
      await loadHistory();
      setStatusMessage(`🎉 [${deviceName}] 3.82km 완주 자동 저장 완료! +${activity.xpEarned} XP & Fog of War 안개 개척!`);
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => {
        setActiveTab('history');
      }, 1200);
    } catch {
      setStatusMessage('❌ 자동 동기화 시뮬레이션 실패');
    } finally {
      setIsSimulating(false);
    }
  }

  // 3. 수동 파일 업로드 처리
  function handleManualFileUpload(file: File) {
    setStatusMessage(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('파일을 읽을 수 없습니다.');
        const result = parseGpxOrTcx(text, file.name);
        setManualParsedData(result);
      } catch (err) {
        setStatusMessage(`⚠️ ${err instanceof Error ? err.message : 'GPX 파싱 실패'}`);
      }
    };
    reader.readAsText(file);
  }

  function handleSaveManualWorkout() {
    if (!manualParsedData) return;
    setIsManualProcessing(true);

    try {
      const freeCourse: Course = {
        id: `gpx-run-${Date.now()}`,
        areaId: 'area-bgc',
        areaName: 'Bonifacio Global City',
        name: manualParsedData.title,
        description: `${manualParsedData.sourceDevice} 연동 운동 기록`,
        courseType: 'running',
        distanceKm: manualParsedData.distanceKm,
        estimatedTimeMin: Math.ceil(manualParsedData.durationSeconds / 60),
        difficulty: 'Easy',
        xpReward: manualParsedData.estimatedXp,
        explorationReward: Math.max(1, Math.round(manualParsedData.distanceKm * 3)),
        startPoint: manualParsedData.routeCoordinates[0] ?? [14.5503, 121.0507],
        finishPoint: manualParsedData.routeCoordinates[manualParsedData.routeCoordinates.length - 1] ?? [14.5503, 121.0507],
        routeCoordinates: manualParsedData.routeCoordinates,
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
        distanceKm: manualParsedData.distanceKm,
        durationSeconds: manualParsedData.durationSeconds
      };

      completeActivityProgress(freeCourse, summary);

      if (manualParsedData.routeCoordinates.length > 0) {
        saveExploredBreadcrumbs(manualParsedData.routeCoordinates);
        recordExplorationDistance('area-bgc', manualParsedData.distanceKm);
      }

      setStatusMessage(`🎉 ${manualParsedData.distanceKm}km 운동 반영 완료! +${manualParsedData.estimatedXp} XP 획득!`);
      if (onSyncSuccess) onSyncSuccess();

      setTimeout(() => {
        onClose();
        navigate('/character-dashboard');
      }, 1000);
    } catch {
      setStatusMessage('❌ 운동 기록 저장 실패');
    } finally {
      setIsManualProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* 1. 상단 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⌚</span>
            <div>
              <h3 className="font-black text-sm tracking-tight">스마트워치 자동 동기화 허브</h3>
              <p className="text-[11px] text-slate-300">Galaxy Watch, Apple Watch, Garmin, Xiaomi DB 자동 연동</p>
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

        {/* 2. 3탭 네비게이션 */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-3 pt-2 gap-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`flex-1 py-2.5 rounded-t-2xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'auto'
                ? 'bg-white text-indigo-700 shadow-sm border-t-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>☁️</span>
            <span>자동 동기화 (Auto)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-t-2xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-700 shadow-sm border-t-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📁</span>
            <span>수동 파일 (GPX)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-t-2xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm border-t-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📜</span>
            <span>동기화 내역 ({syncedActivities.length})</span>
          </button>
        </div>

        {/* 3. 탭별 본문 콘텐츠 */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* ========================================================= */}
          {/* 탭 1: ☁️ 실시간 클라우드 자동 동기화 (Auto Sync)            */}
          {/* ========================================================= */}
          {activeTab === 'auto' && (
            <div className="space-y-4">
              {/* 핵심 안내 배너 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-emerald-50 border border-indigo-100 flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">🚀</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">폰 없이 워치만 차고 달려도 100% 자동 저장</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    워치로 러닝을 마치면 귀가 시 블루투스를 거쳐 <strong>GPS 궤적, 거리, 심박수</strong>가
                    RunQuest Web DB로 실시간 자동 푸시되어 캐릭터 레벨업에 즉시 반영됩니다.
                  </p>
                </div>
              </div>

              {/* 연동 가능한 워치 / 클라우드 플랫폼 리스트 */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Cloud Hub Connections
                </span>

                {(Object.keys(connections) as WearableProvider[]).map((providerKey) => {
                  const conn = connections[providerKey];
                  return (
                    <div
                      key={conn.provider}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{conn.icon}</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">{conn.name}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {conn.isConnected ? `동기화 활성 • ${conn.athleteName || '연동 완료'}` : '미연동 (터치하여 활성화)'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleConnection(conn.provider)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          conn.isConnected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {conn.isConnected ? '연동됨 ✓' : '연결하기 +'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 🧪 원클릭 자동 동기화 시뮬레이터 (개발/검증용) */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Live Auto-Sync Simulator
                </span>

                <button
                  type="button"
                  onClick={() => void handleSimulateAutoSync('samsung_health', 'Galaxy Watch 6')}
                  disabled={isSimulating}
                  className="w-full group relative overflow-hidden py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="text-lg">🧪</span>
                  <span>
                    {isSimulating ? '워치 데이터 Web DB 동기화 중...' : 'Galaxy Watch 3.8km 완주 자동 전송 시뮬레이션'}
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-400" />
                  </span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  버튼 클릭 즉시 BGC 3.8km 궤적 & 156 BPM 심박수가 DB에 자동 INSERT되고 레벨업이 발생합니다.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 탭 2: 📁 수동 GPX/TCX 파일 업로드                         */}
          {/* ========================================================= */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {!manualParsedData ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleManualFileUpload(file);
                  }}
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleManualFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const result = parseGpxOrTcx(SAMPLE_GPX_CONTENT, 'galaxy_watch_bgc.gpx');
                      setManualParsedData(result);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline pt-2"
                  >
                    🧪 샘플 워치 데이터(BGC 3.2km) 즉시 불러와서 테스트하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                      📱 {manualParsedData.sourceDevice}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualParsedData(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      다른 파일 선택
                    </button>
                  </div>

                  <h4 className="font-black text-sm text-slate-900">{manualParsedData.title}</h4>

                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">거리</span>
                      <span className="text-sm font-black text-slate-900">{manualParsedData.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">시간</span>
                      <span className="text-sm font-black text-slate-900">
                        {Math.floor(manualParsedData.durationSeconds / 60)}분 {manualParsedData.durationSeconds % 60}초
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">페이스</span>
                      <span className="text-sm font-black text-indigo-600">{manualParsedData.avgPaceMinKm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">보상</span>
                      <span className="text-sm font-black text-amber-500">+{manualParsedData.estimatedXp} XP</span>
                    </div>
                  </div>

                  {manualParsedData.avgHeartRate !== null && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-black text-rose-600 flex items-center justify-between">
                      <span>❤️ 평균 심박: {manualParsedData.avgHeartRate} BPM</span>
                      {manualParsedData.avgHeartRate >= 145 && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px]">
                          심박수 버닝 보너스 +50 XP
                        </span>
                      )}
                    </div>
                  )}

                  <div className="h-40 w-full rounded-2xl overflow-hidden border border-slate-200">
                    <MapContainer
                      center={manualParsedData.routeCoordinates[0] ?? [14.5503, 121.0507]}
                      zoom={14}
                      zoomControl={false}
                      className="h-full w-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Polyline
                        positions={manualParsedData.routeCoordinates}
                        pathOptions={{ color: '#6366f1', weight: 5, opacity: 0.9 }}
                      />
                    </MapContainer>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveManualWorkout}
                    disabled={isManualProcessing}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>🎉</span>
                    <span>
                      {isManualProcessing ? '저장 중...' : `당일 운동으로 반영하기 (+${manualParsedData.estimatedXp} XP)`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 탭 3: 📜 자동 동기화 내역 (Sync History)                  */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Recent Synced Activities ({syncedActivities.length})
                </span>
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  새로고침 🔄
                </button>
              </div>

              {syncedActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
                  아직 동기화된 운동 기록이 없습니다.
                  <br />
                  [자동 동기화] 탭에서 시뮬레이션을 실행해보세요!
                </div>
              ) : (
                syncedActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{act.activityName}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {act.sourceDevice}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">📏 {act.distanceKm} km</span>
                        <span className="font-bold">⏱️ {Math.floor(act.durationSeconds / 60)}분</span>
                        {act.avgHeartRate && (
                          <span className="font-bold text-rose-500">❤️ {act.avgHeartRate} BPM</span>
                        )}
                      </div>
                      <span className="font-black text-amber-500">+{act.xpEarned} XP</span>
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                      동기화 일시: {new Date(act.syncedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 하단 상태 알림 바 */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center animate-in fade-in duration-200">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
