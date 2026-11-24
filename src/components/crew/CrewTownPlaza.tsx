import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getExplorerOutfitTier,
  getExplorerOutfitTierByNumber,
} from '../../services/aiCharacterService';
import {
  ADDITIONAL_CREW_POOL,
  createMyPlazaMember,
  CREW_QUICK_CHATS,
  INITIAL_CREW_MATES,
  subscribeToCrewPlazaChannel,
  type CrewMotionType,
  type CrewPlazaMember,
} from '../../services/crewPlazaService';
import {
  getPreferredCharacterDisplayMode,
  loadCustomCharacterVideoUrl,
} from '../../utils/customMediaStorage';
import {
  getGameProgress,
  getRankTitleForLevel,
  getRunnerName,
  getSelectedCharacterClass,
} from '../../utils/gameProgress';
import { calculateLevelFromXp } from '../../utils/xp';

interface CrewTownPlazaProps {
  compact?: boolean;
}

const MOTION_BADGE_MAP: Record<CrewMotionType, { icon: string; label: string; badgeClass: string }> = {
  idle: {
    icon: '🌿',
    label: '대기 중',
    badgeClass: 'bg-slate-800/90 text-slate-200 border-slate-600/60',
  },
  walk: {
    icon: '👟',
    label: '워밍업 중',
    badgeClass: 'bg-sky-950/90 text-sky-300 border-sky-400/50',
  },
  stretch: {
    icon: '🧘',
    label: '스트레칭',
    badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50',
  },
  highfive: {
    icon: '🙌',
    label: '하이파이브!',
    badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-400/60',
  },
  ready: {
    icon: '🔥',
    label: '준비 완료',
    badgeClass: 'bg-orange-500 text-white border-amber-300',
  },
};

export default function CrewTownPlaza({ compact = false }: CrewTownPlazaProps) {
  const navigate = useNavigate();

  const progress = getGameProgress();
  const myLevel = calculateLevelFromXp(progress.totalXp);
  const myRank = getRankTitleForLevel(myLevel);
  const myClass = getSelectedCharacterClass();
  const myName = getRunnerName();

  const savedTierNum =
    typeof window !== 'undefined'
      ? Number(window.localStorage.getItem('runquest-selected-outfit-tier'))
      : 0;
  const myTier =
    savedTierNum >= 1 && savedTierNum <= 4
      ? getExplorerOutfitTierByNumber(savedTierNum as 1 | 2 | 3 | 4)
      : getExplorerOutfitTier(myLevel);
  const mySavedAvatar =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('runquest-selected-avatar')
      : null;
  const myEffectiveAvatar =
    mySavedAvatar &&
    (mySavedAvatar.startsWith('data:image/') ||
      mySavedAvatar.startsWith('/images/explorer-tiers/'))
      ? mySavedAvatar
      : myTier.fallbackImage;

  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'video' | 'image'>(() =>
    getPreferredCharacterDisplayMode()
  );

  const [members, setMembers] = useState<CrewPlazaMember[]>(() => [
    createMyPlazaMember({
      name: myName,
      level: myLevel,
      classTitle: `${myClass.name.replace('The ', '')} • ${myRank}`,
      avatarUrl: myEffectiveAvatar,
      tier: myTier,
    }),
    ...INITIAL_CREW_MATES,
  ]);

  const [extraPoolIndex, setExtraPoolIndex] = useState(0);
  const [chatIndex, setChatIndex] = useState(0);
  const [statusNotice, setStatusNotice] = useState(
    '크루원들에게 가벼운 응원을 보내고 함께 러닝을 출발해 보세요.'
  );

  const channelRef = useRef<ReturnType<typeof subscribeToCrewPlazaChannel> | null>(null);

  useEffect(() => {
    void loadCustomCharacterVideoUrl().then((url) => {
      if (url) setCustomVideoUrl(url);
    });

    function syncMyCharacter() {
      const latestProgress = getGameProgress();
      const latestLevel = calculateLevelFromXp(latestProgress.totalXp);
      const latestRank = getRankTitleForLevel(latestLevel);
      const latestClass = getSelectedCharacterClass();
      const latestName = getRunnerName();
      const tierRaw = Number(window.localStorage.getItem('runquest-selected-outfit-tier'));
      const resolvedTier =
        tierRaw >= 1 && tierRaw <= 4
          ? getExplorerOutfitTierByNumber(tierRaw as 1 | 2 | 3 | 4)
          : getExplorerOutfitTier(latestLevel);
      const savedAv = window.localStorage.getItem('runquest-selected-avatar');
      const resolvedAv =
        savedAv &&
        (savedAv.startsWith('data:image/') || savedAv.startsWith('/images/explorer-tiers/'))
          ? savedAv
          : resolvedTier.fallbackImage;

      setDisplayMode(getPreferredCharacterDisplayMode());
      void loadCustomCharacterVideoUrl().then((url) => setCustomVideoUrl(url));

      setMembers((prev) =>
        prev.map((m) =>
          m.isMe
            ? {
                ...m,
                name: latestName,
                level: latestLevel,
                classTitle: `${latestClass.name.replace('The ', '')} • ${latestRank}`,
                outfitName: resolvedTier.outfitName,
                avatarUrl: resolvedAv,
                tierNumber: resolvedTier.tierNumber,
              }
            : m
        )
      );
    }

    window.addEventListener('storage', syncMyCharacter);
    window.addEventListener('runquest-avatar-updated', syncMyCharacter);
    window.addEventListener('runquest-gear-updated', syncMyCharacter);

    return () => {
      window.removeEventListener('storage', syncMyCharacter);
      window.removeEventListener('runquest-avatar-updated', syncMyCharacter);
      window.removeEventListener('runquest-gear-updated', syncMyCharacter);
    };
  }, []);

  useEffect(() => {
    const channel = subscribeToCrewPlazaChannel('bgc-night-striders', (payload) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === payload.memberId
            ? {
                ...m,
                motion: payload.motion ?? m.motion,
                isReady: payload.isReady ?? m.isReady,
                speechBubble: payload.speechBubble ?? m.speechBubble,
              }
            : m
        )
      );
    });
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const readyCount = useMemo(() => members.filter((m) => m.isReady).length, [members]);
  const weeklyCrewKm = useMemo(
    () => Number((42.5 + progress.totalDistanceKm).toFixed(1)),
    [progress.totalDistanceKm]
  );
  const weeklyGoalKm = 60;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyCrewKm / weeklyGoalKm) * 100));

  function triggerLobbyAction(action: 'stretch' | 'highfive' | 'cheer' | 'ready') {
    const myMember = members.find((m) => m.isMe);
    if (!myMember) return;

    if (action === 'stretch') {
      setMembers((prev) =>
        prev.map((m) =>
          m.isMe
            ? { ...m, motion: 'stretch', speechBubble: '출발 전 스트레칭 중! 🧘' }
            : { ...m, motion: 'stretch', speechBubble: '함께 몸 풀어요!' }
        )
      );
      setStatusNotice('🧘 크루원 모두가 출발 전 스트레칭을 시작했습니다.');
      channelRef.current?.broadcast({
        type: 'motion',
        memberId: myMember.id,
        motion: 'stretch',
        speechBubble: '출발 전 스트레칭 중! 🧘',
      });
      return;
    }

    if (action === 'highfive') {
      setMembers((prev) =>
        prev.map((m) =>
          m.isMe
            ? { ...m, motion: 'highfive', speechBubble: '오늘도 완주 화이팅! 🙌' }
            : { ...m, motion: 'highfive', speechBubble: '하이파이브! ⚡' }
        )
      );
      setStatusNotice('🙌 크루원들과 하이파이브를 나눴습니다!');
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          /* ignore */
        }
      }
      channelRef.current?.broadcast({
        type: 'motion',
        memberId: myMember.id,
        motion: 'highfive',
        speechBubble: '오늘도 완주 화이팅! 🙌',
      });
      return;
    }

    if (action === 'cheer') {
      const nextMsg = CREW_QUICK_CHATS[chatIndex % CREW_QUICK_CHATS.length];
      setChatIndex((prev) => prev + 1);
      setMembers((prev) =>
        prev.map((m, idx) =>
          m.isMe
            ? { ...m, speechBubble: nextMsg }
            : idx === 1
              ? { ...m, speechBubble: '좋아요! 같이 달려요 🔥' }
              : m
        )
      );
      setStatusNotice(`💬 "${nextMsg}" 응원을 보냈습니다.`);
      channelRef.current?.broadcast({
        type: 'chat',
        memberId: myMember.id,
        speechBubble: nextMsg,
      });
      return;
    }

    // ready
    const nextReady = !myMember.isReady;
    setMembers((prev) =>
      prev.map((m) =>
        m.isMe
          ? {
              ...m,
              isReady: nextReady,
              motion: nextReady ? 'ready' : 'idle',
              speechBubble: nextReady ? '러닝화 끈 꽉 묶었어요! 출발! 🔥' : '잠시 숨 고르는 중',
            }
          : m
      )
    );
    setStatusNotice(
      nextReady
        ? '🔥 러닝 준비 완료! 이제 크루와 함께 달릴 수 있습니다.'
        : '⏸️ 대기 상태로 전환했습니다.'
    );
    channelRef.current?.broadcast({
      type: 'ready',
      memberId: myMember.id,
      isReady: nextReady,
      motion: nextReady ? 'ready' : 'idle',
    });
  }

  function handleInviteMoreCrew() {
    if (extraPoolIndex >= ADDITIONAL_CREW_POOL.length) {
      setStatusNotice('✨ 현재 크루 로비 정원(6명)이 모두 모였습니다.');
      return;
    }
    const nextMate = ADDITIONAL_CREW_POOL[extraPoolIndex];
    setExtraPoolIndex((prev) => prev + 1);
    setMembers((prev) => [
      ...prev,
      {
        ...nextMate,
        motion: 'ready',
        speechBubble: `${nextMate.name} 합류했어요! 👋`,
      },
    ]);
    setStatusNotice(`👋 ${nextMate.name} (Lv.${nextMate.level}) 님이 크루 로비에 합류했습니다.`);
  }

  const displayedMembers = compact ? members.slice(0, 4) : members;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-md space-y-4">
      {/* 1. 깔끔한 크루 로비 헤더 (Strava Club + RPG 스타일) */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
              Live Crew Run Lobby
            </span>
          </div>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            BGC 조깅 크루 ({members.length}명 집결)
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInviteMoreCrew}
            disabled={extraPoolIndex >= ADDITIONAL_CREW_POOL.length}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 text-[11px] font-black transition-all cursor-pointer"
          >
            + 크루 합류 ({members.length}/6)
          </button>
          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black">
            준비 {readyCount}/{members.length}
          </span>
        </div>
      </div>

      {/* 2. 이번 주 크루 공동 거리 목표 바 (복잡한 % 스탯 대신 직관적 러닝 목표) */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-slate-700 flex items-center gap-1">
            <span>🏃</span>
            <span>이번 주 크루 공동 목표</span>
          </span>
          <span className="font-black text-emerald-700">
            {weeklyCrewKm} / {weeklyGoalKm} km ({weeklyGoalPercent}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${weeklyGoalPercent}%` }}
          />
        </div>
      </div>

      {/* 3. AI 캐릭터 일러스트/영상 중심 크루원 카드 그리드 (겹침 없음 · 화풍 100% 통일) */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayedMembers.map((member) => {
          const motionInfo = MOTION_BADGE_MAP[member.motion] ?? MOTION_BADGE_MAP.idle;
          const showMyVideo = Boolean(member.isMe && customVideoUrl && displayMode === 'video');

          return (
            <div
              key={member.id}
              className={`rounded-2xl overflow-hidden border transition-all flex flex-col bg-slate-900 text-white shadow-sm ${
                member.isMe
                  ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                  : member.motion === 'highfive'
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-slate-200'
              }`}
            >
              {/* 상단 AI 캐릭터 일러스트 / 내 달리는 영상 포트레이트 */}
              <div className="relative aspect-[4/4.3] w-full bg-gradient-to-b from-sky-300 to-emerald-300 overflow-hidden">
                {showMyVideo ? (
                  <video
                    key={customVideoUrl}
                    src={customVideoUrl!}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/explorer-tiers/tier-1-novice.jpg';
                    }}
                    className="w-full h-full object-cover object-top"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/20 pointer-events-none" />

                {/* 좌상단: 나 / 레벨 뱃지 */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                      member.isMe
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950/75 text-white border border-white/20'
                    }`}
                  >
                    {member.isMe ? '👑 나' : `Lv.${member.level}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-md ${motionInfo.badgeClass}`}
                  >
                    {motionInfo.icon} {motionInfo.label}
                  </span>
                </div>

                {/* 하단: 이름 & 착용 복장 티어 */}
                <div className="absolute bottom-2 left-2.5 right-2.5 text-left">
                  <p className="text-xs font-black text-white truncate">
                    {member.name} · Lv.{member.level}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-300 truncate">
                    {member.outfitName}
                  </p>
                </div>
              </div>

              {/* 카드 하단 한줄 응원/상태 영역 (고정 높이로 절대 겹치지 않음) */}
              <div className="px-2.5 py-2 bg-slate-900 border-t border-slate-800 min-h-[38px] flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-slate-200 truncate">
                  {member.speechBubble || `${member.classTitle}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 가벼운 원터치 로비 교감 버튼 (Strava Kudos 스타일) */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => triggerLobbyAction('stretch')}
          className="py-2.5 px-1 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 text-[11px] font-black flex flex-col items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🧘</span>
          <span>스트레칭</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLobbyAction('highfive')}
          className="py-2.5 px-1 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 text-[11px] font-black flex flex-col items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🙌</span>
          <span>하이파이브</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLobbyAction('cheer')}
          className="py-2.5 px-1 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-800 text-[11px] font-black flex flex-col items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">💬</span>
          <span>응원하기</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLobbyAction('ready')}
          className="py-2.5 px-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex flex-col items-center gap-0.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🔥</span>
          <span>준비 완료</span>
        </button>
      </div>

      {/* 5. 상태 안내 & 크루와 함께 달리기 시작 CTA */}
      <div className="space-y-2.5 pt-1">
        <p className="text-[11px] font-bold text-slate-500 text-center">{statusNotice}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🏃</span>
            <span>크루와 함께 달리기 시작</span>
          </button>

          <Link
            to="/character/create"
            className="px-3.5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 transition-all"
          >
            🎨 내 캐릭터
          </Link>
        </div>
      </div>
    </div>
  );
}
