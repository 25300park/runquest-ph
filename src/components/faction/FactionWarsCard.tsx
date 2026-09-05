import { useState } from 'react';
import {
  getFactionScores,
  getUserFaction,
  setUserFaction,
  type FactionId
} from '../../services/factionService';

export default function FactionWarsCard() {
  const [userFaction, setSelectedFaction] = useState<FactionId>(() => getUserFaction());
  const [scores] = useState(() => getFactionScores());
  const [notice, setNotice] = useState<string | null>(null);

  const bgcKm = scores['faction-bgc'].totalDistanceKm;
  const makatiKm = scores['faction-makati'].totalDistanceKm;
  const totalKm = bgcKm + makatiKm;
  const bgcPercent = Math.round((bgcKm / totalKm) * 100);
  const makatiPercent = 100 - bgcPercent;

  function handleSelectFaction(factionId: FactionId) {
    setUserFaction(factionId);
    setSelectedFaction(factionId);
    setNotice(`⚔️ 소속 진영이 [${scores[factionId].name}]으로 설정되었습니다!`);
    setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 font-sans select-none">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
            ⚔️ Weekly Faction War
          </span>
          <h3 className="text-sm font-black text-slate-900 mt-1">
            BGC vs Makati 주간 진영전
          </h3>
          <p className="text-xs text-slate-400">
            이번 주 더 많은 마일리지를 누적한 진영 전원에게 특별 오라(Aura) 지급!
          </p>
        </div>
        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          일요일 자정 정산
        </span>
      </div>

      {notice && (
        <div className="p-2.5 rounded-2xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold text-center animate-in fade-in">
          {notice}
        </div>
      )}

      {/* 진영전 게이지 바 */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-violet-600 flex items-center gap-1">
            <span>🟪 BGC ({bgcPercent}%)</span>
          </span>
          <span className="text-blue-600 flex items-center gap-1">
            <span>🟦 Makati ({makatiPercent}%)</span>
          </span>
        </div>

        {/* 듀얼 프로그레스 바 */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-700"
            style={{ width: `${bgcPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
            style={{ width: `${makatiPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span>{bgcKm.toFixed(1)} km 누적</span>
          <span>{makatiKm.toFixed(1)} km 누적</span>
        </div>
      </div>

      {/* 진영 선택 버튼 2종 */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => handleSelectFaction('faction-bgc')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            userFaction === 'faction-bgc'
              ? 'border-violet-500 bg-violet-50/70 shadow-sm ring-2 ring-violet-300'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-violet-800">🟪 BGC Striders</span>
            {userFaction === 'faction-bgc' && (
              <span className="text-[9px] font-black bg-violet-600 text-white px-1.5 py-0.2 rounded-full">
                내 진영
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{scores['faction-bgc'].weeklyVictoryBonus}</p>
        </button>

        <button
          type="button"
          onClick={() => handleSelectFaction('faction-makati')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            userFaction === 'faction-makati'
              ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-300'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-800">🟦 Makati Foxes</span>
            {userFaction === 'faction-makati' && (
              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                내 진영
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{scores['faction-makati'].weeklyVictoryBonus}</p>
        </button>
      </div>
    </div>
  );
}
