import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  getLocalActivityHistory,
  deleteActivityRecord,
  type ActivityHistoryRecord
} from '../services/activityHistoryService';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  return `${minutes}분 ${seconds}초`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
  } catch {
    return isoString;
  }
}

const startPinIcon = L.divIcon({
  className: '',
  html: `<div style="height:26px;width:26px;border-radius:9999px;border:2px solid white;background:#10b981;display:grid;place-items:center;color:white;font-weight:900;font-size:10px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">S</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const finishPinIcon = L.divIcon({
  className: '',
  html: `<div style="height:26px;width:26px;border-radius:9999px;border:2px solid white;background:#f59e0b;display:grid;place-items:center;color:white;font-weight:900;font-size:10px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">F</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

export default function ActivityHistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ActivityHistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'free_run' | 'quest_run'>('all');
  const [selectedRecord, setSelectedRecord] = useState<ActivityHistoryRecord | null>(null);

  useEffect(() => {
    setRecords(getLocalActivityHistory());
  }, []);

  const filteredRecords = useMemo(() => {
    if (filterType === 'all') return records;
    return records.filter((r) => r.activityType === filterType);
  }, [records, filterType]);

  const summaryStats = useMemo(() => {
    const totalKm = records.reduce((acc, r) => acc + r.distanceKm, 0);
    const totalSec = records.reduce((acc, r) => acc + r.durationSeconds, 0);
    const totalXp = records.reduce((acc, r) => acc + r.xpEarned, 0);
    return {
      totalDistanceKm: totalKm.toFixed(2),
      totalDurationFormatted: formatDuration(totalSec),
      totalCount: records.length,
      totalXp
    };
  }, [records]);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm('이 러닝 기록을 삭제하시겠습니까?')) {
      deleteActivityRecord(id);
      setRecords(getLocalActivityHistory());
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 select-none">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 active:scale-95 transition-all"
          >
            ←
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>📜</span>
              <span>활동 기록 보관소</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">완료된 모든 러닝 궤적과 성과표</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/course-builder')}
          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1"
        >
          <span>🏃</span>
          <span>새 러닝</span>
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* 2. 대시보드 요약 스탯 카드 */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-violet-950/40 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            🏆 All-Time Running Log
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">총 거리</span>
              <span className="text-lg font-black text-amber-400">{summaryStats.totalDistanceKm}</span>
              <span className="text-[9px] text-slate-400 block">km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">총 횟수</span>
              <span className="text-lg font-black text-white">{summaryStats.totalCount}</span>
              <span className="text-[9px] text-slate-400 block">회 완료</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">총 시간</span>
              <span className="text-xs font-black text-emerald-400 block mt-1 leading-tight">
                {summaryStats.totalDurationFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">누적 경험치</span>
              <span className="text-lg font-black text-violet-400">+{summaryStats.totalXp}</span>
              <span className="text-[9px] text-slate-400 block">XP</span>
            </div>
          </div>
        </div>

        {/* 3. 필터 탭 */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('free_run')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              filterType === 'free_run'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏃 자유 러닝 ({records.filter((r) => r.activityType === 'free_run').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('quest_run')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              filterType === 'quest_run'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚔️ 퀘스트 ({records.filter((r) => r.activityType === 'quest_run').length})
          </button>
        </div>

        {/* 4. 기록 표 (Spreadsheet Table View) */}
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">👟</span>
            <p className="text-sm font-bold text-slate-400">아직 저장된 러닝 기록이 없습니다.</p>
            <p className="text-xs text-slate-600">자유 러닝이나 퀘스트를 완료하면 이곳에 표로 자동 기록됩니다.</p>
            <button
              type="button"
              onClick={() => navigate('/course-builder')}
              className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-lg"
            >
              지금 첫 러닝 시작하기
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-3">일시 / 유형</th>
                    <th className="py-3 px-3">러닝 명칭</th>
                    <th className="py-3 px-2 text-right">거리</th>
                    <th className="py-3 px-2 text-right">시간</th>
                    <th className="py-3 px-2 text-right">페이스</th>
                    <th className="py-3 px-2 text-right">XP</th>
                    <th className="py-3 px-3 text-center">경로</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-slate-800/50 cursor-pointer active:bg-slate-800/80 transition-colors"
                    >
                      {/* 일시 & 뱃지 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-slate-200 block">{formatDate(record.createdAt)}</span>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            record.activityType === 'free_run'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {record.activityType === 'free_run' ? '자유러닝' : '퀘스트'}
                        </span>
                      </td>

                      {/* 제목 */}
                      <td className="py-3 px-3 max-w-[120px] truncate">
                        <span className="font-black text-white text-xs block truncate" title={record.title}>
                          {record.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{record.areaName}</span>
                      </td>

                      {/* 거리 */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-amber-400 text-xs">{record.distanceKm.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 ml-0.5">km</span>
                      </td>

                      {/* 시간 */}
                      <td className="py-3 px-2 text-right whitespace-nowrap font-mono text-slate-300 text-xs">
                        {Math.floor(record.durationSeconds / 60)}:
                        {(record.durationSeconds % 60).toString().padStart(2, '0')}
                      </td>

                      {/* 페이스 */}
                      <td className="py-3 px-2 text-right whitespace-nowrap font-mono text-emerald-400 text-xs">
                        {record.paceFormatted}
                      </td>

                      {/* XP */}
                      <td className="py-3 px-2 text-right whitespace-nowrap font-mono font-black text-violet-400 text-xs">
                        +{record.xpEarned}
                      </td>

                      {/* 궤적 버튼 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-200 active:scale-95 shadow-sm"
                          title="지도에서 궤적 보기"
                        >
                          🗺️ 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 5. 🗺️ 경로 상세 보기 모달 (Map Modal) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* 모달 헤더 */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>🗺️</span>
                  <span>{selectedRecord.title}</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  {formatDate(selectedRecord.createdAt)} · {selectedRecord.areaName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* 미니 지도 영역 */}
            <div className="h-64 w-full relative bg-slate-950">
              {selectedRecord.routePoints.length >= 2 ? (
                <MapContainer
                  center={selectedRecord.routePoints[0]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* 외곽선 */}
                  <Polyline
                    positions={selectedRecord.routePoints}
                    pathOptions={{ color: '#0f172a', weight: 8, opacity: 0.45 }}
                  />
                  {/* 메인 네온 라인 */}
                  <Polyline
                    positions={selectedRecord.routePoints}
                    pathOptions={{ color: '#f59e0b', weight: 6, opacity: 0.95 }}
                  />
                  <Marker position={selectedRecord.routePoints[0]} icon={startPinIcon} />
                  <Marker
                    position={selectedRecord.routePoints[selectedRecord.routePoints.length - 1]}
                    icon={finishPinIcon}
                  />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  좌표 데이터가 없습니다.
                </div>
              )}
            </div>

            {/* 스탯 상세 카드 */}
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">이동 거리</span>
                  <span className="text-base font-black text-amber-400">{selectedRecord.distanceKm.toFixed(2)}km</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">운동 시간</span>
                  <span className="text-base font-black text-slate-200">
                    {Math.floor(selectedRecord.durationSeconds / 60)}:
                    {(selectedRecord.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">평균 페이스</span>
                  <span className="text-base font-black text-emerald-400">{selectedRecord.paceFormatted}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">획득 보상</span>
                  <span className="text-base font-black text-violet-400">+{selectedRecord.xpEarned}XP</span>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => handleDelete(selectedRecord.id, e)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <span>🗑️</span>
                  <span>이 기록 삭제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
