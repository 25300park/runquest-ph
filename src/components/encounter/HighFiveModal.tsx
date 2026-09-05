import type { LiveNearbyRunner } from '../../services/liveEncounterService';

interface HighFiveModalProps {
  runner: LiveNearbyRunner;
  onClose: () => void;
}

export default function HighFiveModal({ runner, onClose }: HighFiveModalProps) {
  return (
    <div className="fixed top-6 inset-x-4 z-50 flex justify-center pointer-events-auto animate-in slide-in-from-top-6 fade-in duration-300 font-sans select-none">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-4 shadow-2xl border-2 border-amber-400/80 max-w-sm w-full flex items-center justify-between gap-3 relative overflow-hidden">
        {/* 화려한 배경 반짝이 파티클 */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-violet-500/20 rounded-full blur-xl pointer-events-none"></div>

        {/* 러너 아바타 & 펄스 뱃지 */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src={runner.avatar || '/images/avatars/1.png'}
              alt={runner.name}
              className="w-full h-full object-contain filter drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/avatars/1.png';
              }}
            />
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-slate-900 shadow-md animate-bounce">
            👋
          </span>
        </div>

        {/* 인카운터 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider border border-amber-400/40">
              High-Five! 20m 스침
            </span>
            <span className="text-[10px] text-emerald-400 font-black">+50 XP 획득!</span>
          </div>
          <h4 className="text-xs font-black text-white truncate mt-0.5">
            {runner.name}
          </h4>
          <p className="text-[10px] text-slate-300 truncate">
            {runner.distanceKm}km completed • Pace: {runner.paceMinKm}/km
          </p>
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs shrink-0 transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
