export interface TrophyBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  rewardBuff: string;
  category: 'mileage' | 'conquest' | 'speed' | 'social';
}

export const mockTrophies: TrophyBadge[] = [
  {
    id: 'trophy-first-step',
    name: 'First Quest Pioneer',
    icon: '🌱',
    description: '첫 번째 퀘스트 코스를 완주했습니다.',
    condition: '첫 1회 러닝 완주',
    isUnlocked: true,
    unlockedAt: '2026.08.24',
    rewardBuff: '+5% Starter XP',
    category: 'mileage'
  },
  {
    id: 'trophy-bgc-scout',
    name: 'BGC Green Corridor Master',
    icon: '🌿',
    description: 'BGC Greenway 코스를 3회 이상 완주했습니다.',
    condition: 'BGC Greenway 누적 3회 완주',
    isUnlocked: true,
    unlockedAt: '2026.08.26',
    rewardBuff: '+10% BGC Area XP',
    category: 'conquest'
  },
  {
    id: 'trophy-speed-demon',
    name: 'Speed Cheetah',
    icon: '⚡',
    description: '5:00/km 이하의 페이스로 3km를 질주했습니다.',
    condition: '페이스 5:00/km 이하 기록',
    isUnlocked: true,
    unlockedAt: '2026.08.28',
    rewardBuff: '+5% Speed Buff',
    category: 'speed'
  },
  {
    id: 'trophy-mileage-50k',
    name: 'Manila Marathoner',
    icon: '👑',
    description: '메트로 마닐라 도심에서 누적 50km를 달성했습니다.',
    condition: '누적 주행 거리 50km 달성',
    isUnlocked: false,
    rewardBuff: '전설의 황금 토끼 스킨 해금',
    category: 'mileage'
  },
  {
    id: 'trophy-high-five-10',
    name: 'High-Five Champion',
    icon: '🤝',
    description: '스쳐간 러너들과 10회 이상 High-Five를 나눴습니다.',
    condition: 'High-Five 인카운터 10회 달성',
    isUnlocked: false,
    rewardBuff: '+15% Social Buff Drop',
    category: 'social'
  },
  {
    id: 'trophy-territory-lord',
    name: 'Ayala Triangle Lord',
    icon: '🏰',
    description: '마카티 아얄라 트라이앵글 랜드마크 점령전 1위를 탈환했습니다.',
    condition: '랜드마크 1위 지배자 등극',
    isUnlocked: false,
    rewardBuff: '+20% Territory Tax Gold',
    category: 'conquest'
  }
];

interface TrophyRoomModalProps {
  onClose: () => void;
}

export default function TrophyRoomModal({ onClose }: TrophyRoomModalProps) {
  const unlockedCount = mockTrophies.filter((t) => t.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-700 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-black text-base text-white">Trophy Room (트로피 룸)</h3>
              <p className="text-[11px] text-amber-300 font-bold">
                달성 완료: {unlockedCount} / {mockTrophies.length} 트로피
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 트로피 그리드 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  trophy.isUnlocked
                    ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-amber-400/50 shadow-md shadow-amber-400/10'
                    : 'bg-slate-950/60 border-slate-800 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl filter ${trophy.isUnlocked ? '' : 'grayscale'}`}>
                      {trophy.icon}
                    </span>
                    {trophy.isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/40">
                        달성됨 ({trophy.unlockedAt})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold border border-slate-700 flex items-center gap-1">
                        🔒 잠김
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-black ${trophy.isUnlocked ? 'text-amber-200' : 'text-slate-400'}`}>
                    {trophy.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {trophy.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500 font-bold">조건: </span>
                  <span className="text-slate-300 font-medium">{trophy.condition}</span>
                  <div className="text-emerald-400 font-black mt-0.5">
                    ✨ {trophy.rewardBuff}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-black text-white text-xs shadow-lg shadow-violet-600/30 active:scale-95 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}
