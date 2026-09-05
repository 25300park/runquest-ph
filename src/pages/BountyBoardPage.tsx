import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSavedBounties,
  type BountyQuest
} from '../services/bountyService';

export default function BountyBoardPage() {
  const navigate = useNavigate();
  const [bounties] = useState<BountyQuest[]>(() => getSavedBounties());
  const [selectedArea, setSelectedArea] = useState<'All' | 'BGC' | 'Makati' | 'MOA'>('All');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'distance' | 'reward'>('popular');
  const [activeDownloadNotice, setActiveDownloadNotice] = useState<string | null>(null);

  const filteredBounties = bounties
    .filter((b) => (selectedArea === 'All' ? true : b.area === selectedArea))
    .sort((a, b) => {
      if (selectedSort === 'popular') return b.totalClears - a.totalClears;
      if (selectedSort === 'distance') return a.distanceKm - b.distanceKm;
      return b.royaltyGold - a.royaltyGold;
    });

  function handleDownloadQuest(quest: BountyQuest) {
    setActiveDownloadNotice(`📥 [${quest.title}] 코스가 다운로드되어 퀘스트 목록에 추가되었습니다!`);
    setTimeout(() => {
      setActiveDownloadNotice(null);
      navigate('/map');
    }, 1500);
  }

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-4 text-slate-900 font-sans pb-28 select-none">
      {/* 1. 상단 타이틀 & 퀘스트 등록 버튼 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
              📜 UGC Creator Market
            </span>
            <h1 className="mt-1.5 text-2xl font-black text-slate-900">Bounty Board (퀘스트 의뢰소)</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              유저들이 직접 개척한 특별 코스를 탐험하고 완주해 보세요!
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/course-builder')}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-violet-500/25 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>➕</span>
            <span>코스 등록</span>
          </button>
        </div>
      </div>

      {/* 다운로드 알림 배너 */}
      {activeDownloadNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-in fade-in shadow-sm">
          {activeDownloadNotice}
        </div>
      )}

      {/* 2. 지역 및 정렬 필터 칩 */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* 지역 필터 */}
        <div className="flex gap-1.5 shrink-0">
          {(['All', 'BGC', 'Makati', 'MOA'] as const).map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedArea === area
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {area === 'All' ? '🌐 전체' : `📍 ${area}`}
            </button>
          ))}
        </div>

        {/* 정렬 필터 */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedSort('popular')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all ${
              selectedSort === 'popular' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            인기순
          </button>
          <button
            type="button"
            onClick={() => setSelectedSort('distance')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all ${
              selectedSort === 'distance' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            거리순
          </button>
          <button
            type="button"
            onClick={() => setSelectedSort('reward')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all ${
              selectedSort === 'reward' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            보상순
          </button>
        </div>
      </div>

      {/* 3. 코스 카드 목록 그리드 */}
      <div className="space-y-3">
        {filteredBounties.map((quest) => (
          <div
            key={quest.id}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-3 transition-all hover:border-violet-200"
          >
            {/* 카드 상단: 크리에이터 & 난이도 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
                  <img
                    src={quest.creatorAvatar}
                    alt={quest.creatorName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatars/1.png';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800">{quest.creatorName}</span>
                  <span className="text-[10px] text-slate-400 block">{quest.createdAt} 등록</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black">
                  ⭐ {quest.rating} ({quest.totalClears}회 완주)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    quest.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700'
                      : quest.difficulty === 'Normal'
                      ? 'bg-blue-50 text-blue-700'
                      : quest.difficulty === 'Hard'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {quest.difficulty}
                </span>
              </div>
            </div>

            {/* 카드 본문: 코스 제목 및 설명 */}
            <div>
              <h3 className="text-sm font-black text-slate-900">{quest.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{quest.description}</p>
            </div>

            {/* 태그 목록 */}
            <div className="flex flex-wrap gap-1.5">
              {quest.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 카드 하단: 거리 / 완주 시 원작자 로열티 / 퀘스트 다운로드 버튼 */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs font-black">
                <span className="text-slate-700">📍 {quest.distanceKm} km</span>
                <span className="text-amber-600 flex items-center gap-1">
                  <span>🪙</span>
                  <span>로열티 +{quest.royaltyGold}G</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadQuest(quest)}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-md shadow-violet-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>📥</span>
                <span>코스 다운로드</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
