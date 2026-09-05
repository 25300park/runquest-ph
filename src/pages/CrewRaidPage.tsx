import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  defaultBgcRaid,
  checkGeofenceInside
} from '../services/crewRaidService';
import type { LatLngTuple } from '../types/area';

export default function CrewRaidPage() {
  const navigate = useNavigate();
  const [raid] = useState(defaultBgcRaid);
  const [userCoord, setUserCoord] = useState<LatLngTuple>([14.5535, 121.0535]); // 기본 200m 원거리
  const [secondsLeft, setSecondsLeft] = useState(raid.targetSecondsLeft);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // 1. 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 브라우저 GPS 및 Playwright E2E Mocking 이벤트 리스닝
  useEffect(() => {
    function handleGpsEvent(e: Event) {
      const customEvent = e as CustomEvent<{ latitude: number; longitude: number }>;
      if (customEvent.detail) {
        setUserCoord([customEvent.detail.latitude, customEvent.detail.longitude]);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('runquest:gps-update', handleGpsEvent);

      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setUserCoord([pos.coords.latitude, pos.coords.longitude]);
          },
          () => undefined,
          { enableHighAccuracy: true }
        );
        return () => {
          window.removeEventListener('runquest:gps-update', handleGpsEvent);
          navigator.geolocation.clearWatch(watchId);
        };
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('runquest:gps-update', handleGpsEvent);
      }
    };
  }, []);

  const { isInside, distanceMeters } = checkGeofenceInside(userCoord, raid.targetCoord, raid.geofenceRadiusMeters);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  function handleCheckIn() {
    setIsCheckedIn(true);
    setShowRewardModal(true);
  }

  return (
    <section className="min-h-full space-y-4 bg-slate-950 px-4 py-4 text-white font-sans pb-28 select-none">
      {/* 1. 상단 네비게이션 */}
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>←</span>
          <span>뒤로</span>
        </button>
        <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40">
          🔥 Live O2O Raid
        </span>
      </header>

      {/* 2. 보스 몬스터 & 홀로그램 비콘 히어로 카드 */}
      <div
        data-testid="raid-beacon-marker"
        className="raid-beacon-pin relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/50 p-6 shadow-2xl space-y-4 text-center"
      >
        {/* 네온 배경 글로우 */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-1 shadow-2xl flex items-center justify-center animate-bounce">
            <span className="text-5xl filter drop-shadow-lg">{raid.bossMonsterIcon}</span>
          </div>
          <span className="inline-block mt-3 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase border border-rose-500/40">
            World Boss Lv.50
          </span>
          <h1 className="text-xl font-black text-white mt-1">{raid.title}</h1>
          <p className="text-xs text-indigo-200 mt-1">📍 {raid.locationName}</p>
        </div>

        {/* 카운트다운 타이머 박스 */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex items-center justify-around">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">집결 시간</span>
            <span className="text-xs font-black text-amber-300">{raid.startTime}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">남은 시간</span>
            <span className="text-base font-mono font-black text-cyan-400 tracking-wider">
              {timerDisplay}
            </span>
          </div>
        </div>

        {/* 참가자 아바타 스택 */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="flex -space-x-3 overflow-hidden">
            {raid.participantAvatars.map((avatar, idx) => (
              <div
                key={idx}
                className="inline-block w-8 h-8 rounded-full ring-2 ring-slate-900 overflow-hidden bg-slate-800"
              >
                <img src={avatar} alt="Runner" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
          <span className="text-xs font-black text-indigo-300">
            +{raid.totalParticipants}명 참가 대기 중
          </span>
        </div>
      </div>

      {/* 3. 지오펜스 거리 측정 상태 배너 */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          isInside
            ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{isInside ? '🎯' : '🛰️'}</span>
          <div>
            <h4 className="text-xs font-black">
              {isInside ? '현장 지오펜스 50m 진입 성공!' : '집결지 접근 중'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              현재 집결지까지 거리: <strong className="text-white">{distanceMeters}m</strong> (50m 이내 체크인 가능)
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
            isInside ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isInside ? '체크인 가능' : '원거리'}
        </span>
      </div>

      {/* 4. 하단 Sticky CTA 버튼 (지오펜스에 따라 즉시 전환) */}
      <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40">
        {isInside ? (
          <button
            type="button"
            data-testid="btn-raid-checkin"
            disabled={isCheckedIn}
            onClick={handleCheckIn}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
              isCheckedIn
                ? 'bg-emerald-700 text-white cursor-default'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-orange-500/40 animate-pulse ring-4 ring-orange-400/40'
            }`}
          >
            <span>🔥</span>
            <span>{isCheckedIn ? '체크인 완료됨' : '🔥 현장 체크인 (Check-in)'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => alert('집결지 50m 이내로 접근하시면 [🔥 현장 체크인] 버튼이 활성화됩니다!')}
            className="w-full py-4 rounded-2xl bg-slate-800 border border-slate-700 font-black text-xs text-slate-400 shadow-xl flex items-center justify-center gap-2"
          >
            <span>📍</span>
            <span>Join Raid (50m 접근 시 활성화)</span>
          </button>
        )}
      </div>

      {/* 5. 체크인 완료 & 보상 획득 모달 */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-amber-400 space-y-4 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Raid Completed
              </span>
              <h3 className="text-xl font-black text-white mt-1">현장 체크인 완료!</h3>
              <p className="text-xs text-slate-300 mt-1">
                오프라인 집결에 참여해 주셔서 감사합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">경험치 보상:</span>
                <span className="font-black text-emerald-400">+500 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">골드 보상:</span>
                <span className="font-black text-yellow-400">+100 Gold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">전설 뱃지:</span>
                <span className="font-black text-amber-300">👑 BGC Raid Conqueror</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowRewardModal(false);
                navigate('/character-dashboard');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 font-black text-slate-950 text-xs shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
            >
              보상 수령 완료
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
