import { useState } from 'react';

export interface RivalRunnerLog {
  id: string;
  name: string;
  avatar: string;
  passedLocation: string;
  paceMinKm: string;
  distanceKm: number;
  timeDifferenceSec: number;
  status: 'encountered' | 'challenged' | 'crew_invited';
}

export const mockRivalLogs: RivalRunnerLog[] = [
  {
    id: 'rival-1',
    name: 'BGC_Shadow_Ninja',
    avatar: '/images/avatars/3.png',
    passedLocation: 'BGC High Street 7th Ave',
    paceMinKm: '4:48',
    distanceKm: 5.2,
    timeDifferenceSec: 12,
    status: 'encountered'
  },
  {
    id: 'rival-2',
    name: 'Manila_Night_Owl',
    avatar: '/images/avatars/6.png',
    passedLocation: 'Greenway South Gate',
    paceMinKm: '5:15',
    distanceKm: 3.8,
    timeDifferenceSec: 35,
    status: 'encountered'
  },
  {
    id: 'rival-3',
    name: 'Makati_Pacer_Fox',
    avatar: '/images/avatars/7.png',
    passedLocation: 'Terra 28th Park',
    paceMinKm: '5:02',
    distanceKm: 6.0,
    timeDifferenceSec: 54,
    status: 'encountered'
  }
];

export default function RivalLogList() {
  const [logs, setLogs] = useState<RivalRunnerLog[]>(mockRivalLogs);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  function handleChallenge(id: string, name: string) {
    setLogs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'challenged' } : item))
    );
    setActiveNotice(`⚔️ ${name}님에게 라이벌 1:1 고스트 매치 도전장을 발송했습니다!`);
    setTimeout(() => setActiveNotice(null), 3500);
  }

  function handleInvite(id: string, name: string) {
    setLogs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'crew_invited' } : item))
    );
    setActiveNotice(`🤝 ${name}님에게 크루(Crew) 가입 초대장을 보냈습니다!`);
    setTimeout(() => setActiveNotice(null), 3500);
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 font-sans select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span>👥</span> Today's Passed Runners (스쳐간 러너 로그)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Strava Flybys: 오늘 같은 코스에서 교차한 러너들입니다.</p>
        </div>
        <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
          {logs.length} Encounters
        </span>
      </div>

      {activeNotice && (
        <div className="p-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold text-center animate-in fade-in">
          {activeNotice}
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        {logs.map((rival) => (
          <div
            key={rival.id}
            className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={rival.avatar}
                  alt={rival.name}
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/avatars/1.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate">{rival.name}</h4>
                  <span className="text-[9px] font-bold text-slate-400">
                    ±{rival.timeDifferenceSec}초 차이
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  📍 {rival.passedLocation} • Pace: {rival.paceMinKm}/km ({rival.distanceKm}km)
                </p>
              </div>
            </div>

            {/* 인터랙션 버튼 (라이벌 매치 / 크루 초대) */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleChallenge(rival.id, rival.name)}
                disabled={rival.status === 'challenged'}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs ${
                  rival.status === 'challenged'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                {rival.status === 'challenged' ? '⚔️ 도전장 전송됨' : '⚔️ 라이벌 매치'}
              </button>

              <button
                type="button"
                onClick={() => handleInvite(rival.id, rival.name)}
                disabled={rival.status === 'crew_invited'}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs ${
                  rival.status === 'crew_invited'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/20'
                }`}
              >
                {rival.status === 'crew_invited' ? '🤝 초대 완료' : '🤝 크루 초대'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
