import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCharacterProfile, subscribeToCharacterUpdates } from '../services/characterService';
import { subscribeToAvatarRealtime } from '../services/aiAvatarService';
import type { CharacterProfile } from '../types/rpgCharacter';
import {
  getGameProgress,
  getRankTitleForLevel,
  getRunnerName,
  getSelectedCharacterClass
} from '../utils/gameProgress';
import { calculateLevelFromXp, getCurrentLevelBaseXp, getNextLevelXp } from '../utils/xp';
import { getSavedExplorationStats } from '../utils/fogOfWar';
import { getAvatarThumbnail, isVideoAvatar, normalizeAvatarUrl } from '../utils/avatarUtils';
import {
  getEquippedLevelGears,
  getExplorerOutfitTier,
  getExplorerOutfitTierByNumber,
  LEVEL_EQUIPMENT_PROGRESSION,
} from '../services/aiCharacterService';
import {
  getPreferredCharacterDisplayMode,
  loadCustomCharacterVideoUrl,
} from '../utils/customMediaStorage';
import WearableSyncModal from '../components/wearable/WearableSyncModal';

function getCurrentWeekdays(): Array<{ day: string; date: number; fullDate: string; isToday: boolean }> {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 이번 주 월요일 계산 (월요일 시작 기준)
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  return Array.from({ length: 7 }).map((_, index) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + index);

    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    return {
      day: dayNames[targetDate.getDay()],
      date: targetDate.getDate(),
      fullDate: targetDate.toISOString().split('T')[0],
      isToday
    };
  });
}

export default function CharacterDashboardPage() {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [status, setStatus] = useState('');
  const [showGpxModal, setShowGpxModal] = useState(false);
  const [totalXpOverride, setTotalXpOverride] = useState<number | null>(null);
  const [customRunnerName, setCustomRunnerName] = useState(() => getRunnerName());
  const [customAvatarUrl, setCustomAvatarUrl] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('runquest-selected-avatar') : null;
    return saved ? normalizeAvatarUrl(saved) : '';
  });
  const [selectedClass, setSelectedClass] = useState(() => getSelectedCharacterClass());
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'video' | 'image'>(() =>
    getPreferredCharacterDisplayMode()
  );

  const weekdays = useMemo(() => getCurrentWeekdays(), []);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    async function loadProfile() {
      try {
        const nextProfile = await getCharacterProfile();
        setProfile(nextProfile);
        setStatus('');

        if (nextProfile && nextProfile.character && nextProfile.character.id) {
          const charId = nextProfile.character.id;
          const refresh = async () => {
            try {
              const refreshedProfile = await getCharacterProfile(charId);
              if (refreshedProfile) setProfile(refreshedProfile);
            } catch {
              // Ignore background refresh errors
            }
          };

          try { unsubscribers.push(subscribeToCharacterUpdates(charId, refresh)); } catch { /* ignore */ }
          try { unsubscribers.push(subscribeToAvatarRealtime(charId, refresh)); } catch { /* ignore */ }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load character.';
        setStatus(message);
      }
    }

    void loadProfile();

    function syncAvatarState() {
      if (typeof window !== 'undefined') {
        setCustomRunnerName(getRunnerName());
        const latestAvatar = window.localStorage.getItem('runquest-selected-avatar');
        if (latestAvatar) setCustomAvatarUrl(normalizeAvatarUrl(latestAvatar));
        setSelectedClass(getSelectedCharacterClass());
        setDisplayMode(getPreferredCharacterDisplayMode());
        void loadCustomCharacterVideoUrl().then((url) => setCustomVideoUrl(url));
      }
    }

    function handleWearableSynced() {
      const nextProgress = getGameProgress();
      setTotalXpOverride(nextProgress.totalXp);
    }

    syncAvatarState();
    window.addEventListener('storage', syncAvatarState);
    window.addEventListener('runquest-avatar-updated', syncAvatarState);
    window.addEventListener('runquest-class-updated', syncAvatarState);
    window.addEventListener('runquest-gear-updated', syncAvatarState);
    window.addEventListener('runquest:wearable-activity-synced', handleWearableSynced);

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        try { unsubscribe(); } catch { /* ignore */ }
      });
      window.removeEventListener('storage', syncAvatarState);
      window.removeEventListener('runquest-avatar-updated', syncAvatarState);
      window.removeEventListener('runquest-class-updated', syncAvatarState);
      window.removeEventListener('runquest-gear-updated', syncAvatarState);
      window.removeEventListener('runquest:wearable-activity-synced', handleWearableSynced);
    };
  }, []);

  const progress = getGameProgress();
  const effectiveTotalXp = totalXpOverride ?? progress.totalXp;
  const currentLevel = calculateLevelFromXp(effectiveTotalXp);
  const rankTitle = getRankTitleForLevel(currentLevel);
  const nextLevelXp = getNextLevelXp(effectiveTotalXp);
  const currentLevelBaseXp = getCurrentLevelBaseXp(effectiveTotalXp);
  const xpProgressPercent =
    nextLevelXp <= effectiveTotalXp
      ? 100
      : Math.round(
          ((effectiveTotalXp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100
        );
  const currentLevelCurrentXp = effectiveTotalXp - currentLevelBaseXp;
  const currentLevelRequiredXp = nextLevelXp - currentLevelBaseXp;

  const runnerName = customRunnerName || profile?.character.name || 'Runner';
  const savedTierRaw =
    typeof window !== 'undefined'
      ? Number(window.localStorage.getItem('runquest-selected-outfit-tier'))
      : 0;
  const outfitTier =
    savedTierRaw >= 1 && savedTierRaw <= 4
      ? getExplorerOutfitTierByNumber(savedTierRaw as 1 | 2 | 3 | 4)
      : getExplorerOutfitTier(currentLevel);
  const avatarUrl =
    customAvatarUrl &&
    (customAvatarUrl.startsWith('data:image/') ||
      customAvatarUrl.startsWith('/images/explorer-tiers/'))
      ? customAvatarUrl
      : outfitTier.fallbackImage;
  const isAnimeExplorerArt =
    avatarUrl.startsWith('/images/explorer-tiers/') || avatarUrl.startsWith('data:image/');
  const equippedGrowthGears = getEquippedLevelGears(currentLevel);
  const nextLevelGear = LEVEL_EQUIPMENT_PROGRESSION.find((g) => g.level === currentLevel + 1);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans pb-16 select-none relative">
      {/* 1. 상단 프로필 헤더 */}
      <header className="pt-4 px-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Welcome back • {status || 'Ready to Run'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <h1 className="text-xl font-black text-slate-900">
              Hello, {runnerName} 👋
            </h1>
            <Link
              to="/character"
              className="px-2 py-0.5 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 text-[10px] font-black uppercase tracking-tight transition-all"
              title="클래스 변경하기"
            >
              {selectedClass.name.replace('The ', '')} • {rankTitle}
            </Link>
          </div>
          <p className="text-[10px] font-bold text-teal-600 mt-0.5">
            ✨ {selectedClass.bonus}
          </p>
        </div>

        {/* 우측 랜딩 영상 확인 & 스마트워치 연동 & 랭킹 & 프로필 아바타 버튼 */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1"
            title="랜딩페이지 달리는 배경 영상 확인하기"
          >
            <span>🎬</span>
            <span>랜딩 영상</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowGpxModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            title="스마트워치 운동 데이터(.gpx) 가져오기"
          >
            <span>⌚</span>
            <span>워치 연동</span>
          </button>

          <Link
            to="/leaderboard"
            className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-700 flex items-center justify-center text-lg shadow-sm active:scale-95 transition-all"
            title="월간 랭킹 (Leaderboard)"
          >
            🏆
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shadow-md active:scale-95 transition-all overflow-hidden"
          >
            <img
              src={getAvatarThumbnail(avatarUrl, currentLevel)}
              alt={runnerName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = outfitTier.fallbackImage;
              }}
              className="w-full h-full object-cover object-top"
            />
          </Link>
        </div>
      </header>

      {/* ⌚ 스마트워치 클라우드 자동 동기화 & GPX 모달 */}
      <WearableSyncModal
        isOpen={showGpxModal}
        onClose={() => setShowGpxModal(false)}
        onSyncSuccess={() => {
          const nextProgress = getGameProgress();
          setTotalXpOverride(nextProgress.totalXp);
        }}
      />

      {/* 2. 주간 캘린더 스트립 (Mon ~ Sun) */}
      <section className="px-5 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 flex items-center justify-between gap-1">
          {weekdays.map((item) => (
            <div
              key={item.day}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                item.isToday
                  ? 'bg-gradient-to-b from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 scale-105'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{item.day}</span>
              <span className={`text-xs font-black mt-0.5 ${item.isToday ? 'text-white' : 'text-slate-700'}`}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 메인 RPG 카드 (핵심: 동화풍 맑은 자연 모험 배경 + 3D 캐릭터/비디오 피규어 + HUD + Start CTA) */}
      <section className="px-5 py-2">
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 relative overflow-hidden flex flex-col gap-3">
          {/* 캐릭터 애니메이션 RPG 탐험가 뷰포트 */}
          <div className="relative w-full aspect-[9/16] max-h-[380px] rounded-2xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-400 shadow-inner flex flex-col justify-between p-4 border border-emerald-200/60">
            {customVideoUrl && displayMode === 'video' ? (
              <>
                <video
                  key={customVideoUrl}
                  src={customVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />
              </>
            ) : isAnimeExplorerArt ? (
              <>
                <img
                  src={avatarUrl}
                  alt="Anime RPG Explorer Avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = outfitTier.fallbackImage;
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />
              </>
            ) : (
              <>
                {/* 햇살 광원 & 뭉게구름 자연 배경 레이어 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-100/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2 left-4 w-20 h-8 bg-white/40 rounded-full blur-md pointer-events-none" />
                <div className="absolute top-6 right-6 w-28 h-10 bg-white/50 rounded-full blur-lg pointer-events-none" />

                {/* 싱그러운 푸른 언덕 실루엣 */}
                <div className="absolute -bottom-6 -left-10 -right-10 h-36 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-[50%] pointer-events-none opacity-90 shadow-lg" />
                <div className="absolute -bottom-10 -left-6 -right-6 h-28 bg-emerald-700 rounded-[50%] pointer-events-none" />
              </>
            )}

            {/* 상단 오버레이: 현재 레벨 & 누적 거리 배지 */}
            <div className="relative z-20 flex items-center justify-between gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/25 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-sm">
                <span>🏅</span> Lv.{currentLevel} • {rankTitle}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/25 text-[10px] font-black text-emerald-300 flex items-center gap-1 shadow-sm">
                <span>🏃</span> {progress.totalDistanceKm.toFixed(1)} km 누적
              </span>
            </div>

            {!isAnimeExplorerArt && (
              <div className="relative z-10 my-auto flex flex-col items-center justify-center pt-2">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center animate-in zoom-in duration-300">
                  {isVideoAvatar(avatarUrl) ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain filter drop-shadow-[0_16px_24px_rgba(6,78,59,0.45)] rounded-2xl"
                    >
                      <source src="/images/avatars/8.webm" type="video/webm" />
                      <source src="/images/avatars/8.mp4" type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={avatarUrl}
                      alt="Selected Hero Avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = outfitTier.fallbackImage;
                      }}
                      className="w-full h-full object-contain filter drop-shadow-[0_16px_24px_rgba(6,78,59,0.45)]"
                    />
                  )}
                </div>
                <div className="w-36 h-3.5 bg-emerald-950/30 rounded-full blur-[3px] -mt-3.5 border border-emerald-400/20" />
              </div>
            )}

            {/* 하단 오버레이: 현재 착용 의상 티어 & 레벨/EXP 프로그레스 바 */}
            <div className="relative z-20 space-y-2 mt-auto">
              <div className="flex flex-wrap gap-1">
                {equippedGrowthGears.slice(-3).map((g) => (
                  <span
                    key={g.id}
                    className="px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/25 text-[9px] font-bold text-white shadow-xs"
                  >
                    {g.slotIcon} Lv.{g.level} {g.itemName}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-400/40 text-[10px] font-black text-emerald-300 shadow-sm truncate">
                  👕 Tier {outfitTier.tierNumber} • {outfitTier.outfitName}
                </span>
                <Link
                  to="/character/create"
                  className="px-2.5 py-1 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-black shadow-md border border-emerald-300/40 shrink-0 transition-all"
                >
                  📸 사진·영상 캐릭터 스튜디오
                </Link>
              </div>
              <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-300">Level {currentLevel}</span>
                  <span className="text-[11px] text-slate-300 font-mono font-bold">
                    {xpProgressPercent}% ({currentLevelCurrentXp}/{currentLevelRequiredXp} XP)
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${xpProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 카드 최하단 메인 액션 버튼 */}
          <Link
            to="/map"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-violet-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/20"
          >
            <span className="text-lg">▶️</span>
            <span>Start Daily Quest</span>
          </Link>

          {/* 서브 액션: 자유 러닝 및 활동 기록 보관소 */}
          <div className="flex gap-2">
            <Link
              to="/course-builder"
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-slate-200 shadow-sm"
            >
              <span>🏃</span>
              <span>자유 러닝</span>
            </Link>
            <Link
              to="/history"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-extrabold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>📜</span>
              <span>활동 기록 보관소</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3.5 🏕️ 크루 집결 광장 & 크루 관리 통합 페이지 바로가기 배너 */}
      <section className="px-5 pt-3">
        <Link
          to="/crew"
          className="block rounded-3xl p-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/50 shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center text-2xl shrink-0">
                🏕️
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Crew Run Lobby
                </span>
                <h3 className="text-sm font-black text-white mt-1">
                  BGC 조깅 크루 로비 · 함께 달리기
                </h3>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">
                  크루원 AI 캐릭터 집결 · 주간 공동 목표 · 원터치 응원
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 shrink-0">
              로비 입장 →
            </span>
          </div>
        </Link>
      </section>

      {/* 4. 🗺️ 도시 탐험 진행도 (City Exploration) */}
      <section className="px-5 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🗺️</span> City Exploration
          </h2>
          <Link to="/map" className="text-[10px] font-black text-violet-600 hover:underline">
            지도 보기 →
          </Link>
        </div>

        <div className="grid gap-2.5">
          {getSavedExplorationStats().map((stat) => (
            <div
              key={stat.areaId}
              className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-800">{stat.areaName}</span>
                <span className="text-violet-700 font-extrabold">{stat.revealedPercentage}% Revealed</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${stat.revealedPercentage}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>{stat.totalKmCovered} km explored</span>
                <span>{stat.unlockedSectors}/{stat.totalSectors} sectors cleared</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 현재 장착 장비 & 다음 레벨 해금 목표 (단순화된 성장 루프) */}
      <section className="px-5 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>✨</span> 착용 장비 & 성장 목표 ({equippedGrowthGears.length}종)
          </h2>
          <Link to="/character/create" className="text-[10px] font-black text-emerald-700 hover:underline">
            장비·복장 관리 →
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {equippedGrowthGears.map((gear) => (
              <span
                key={gear.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-slate-800"
              >
                <span>{gear.slotIcon}</span>
                <span>Lv.{gear.level} {gear.itemName}</span>
              </span>
            ))}
          </div>

          {nextLevelGear && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-amber-800 uppercase">
                  🎯 다음 해금 목표 (Lv.{nextLevelGear.level})
                </p>
                <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                  {nextLevelGear.slotIcon} {nextLevelGear.itemName}
                </p>
                <p className="text-[10px] text-slate-600 truncate">
                  {nextLevelGear.acquisitionMethod}
                </p>
              </div>
              <Link
                to="/character/create"
                className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black shrink-0"
              >
                보기
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
