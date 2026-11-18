import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getExplorerOutfitTier,
  getExplorerOutfitTierByNumber,
} from '../../services/aiCharacterService';
import {
  ADDITIONAL_CREW_POOL,
  calculateCrewSynergyBonus,
  createMyPlazaMember,
  CREW_QUICK_CHATS,
  INITIAL_CREW_MATES,
  subscribeToCrewPlazaChannel,
  VILLAGE_ROAD_WAYPOINTS,
  type CrewMotionType,
  type CrewPlazaMember,
} from '../../services/crewPlazaService';
import {
  getGameProgress,
  getRankTitleForLevel,
  getRunnerName,
  getSelectedCharacterClass,
} from '../../utils/gameProgress';
import { calculateLevelFromXp } from '../../utils/xp';
import AnimatedCartoonRunner from './AnimatedCartoonRunner';

interface CrewTownPlazaProps {
  compact?: boolean;
}

export default function CrewTownPlaza({ compact = false }: CrewTownPlazaProps) {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement | null>(null);

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
  const [clickTarget, setClickTarget] = useState<{ x: number; y: number } | null>(null);
  const [highFiveEffect, setHighFiveEffect] = useState<{ x: number; y: number } | null>(null);
  const [isDeparting, setIsDeparting] = useState(false);
  const [plazaLog, setPlazaLog] = useState(
    '🏘️ 마을 길 아무 곳이나 터치하면 내 2D 만화 캐릭터가 팔다리를 흔들며 걸어갑니다!'
  );

  const channelRef = useRef<ReturnType<typeof subscribeToCrewPlazaChannel> | null>(null);

  // 내 캐릭터 정보(이름/레벨/의상) 변경 시 즉시 광장 내 2D 캐릭터 외형 동기화
  useEffect(() => {
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
    window.addEventListener('runquest-class-updated', syncMyCharacter);
    return () => {
      window.removeEventListener('storage', syncMyCharacter);
      window.removeEventListener('runquest-avatar-updated', syncMyCharacter);
      window.removeEventListener('runquest-class-updated', syncMyCharacter);
    };
  }, []);

  // 실시간 채널 구독 & 크루원들이 마을 길 따라 자유롭게 걸어다니는 루프
  useEffect(() => {
    const sub = subscribeToCrewPlazaChannel('bgc-vanguard', (payload) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== payload.memberId) return m;
          return {
            ...m,
            x: payload.x ?? m.x,
            y: payload.y ?? m.y,
            motion: payload.motion ?? m.motion,
            isReady: payload.isReady ?? m.isReady,
            speechBubble: payload.speechBubble ?? m.speechBubble,
          };
        })
      );
    });
    channelRef.current = sub;

    const npcInterval = setInterval(() => {
      setMembers((prev) =>
        prev.map((m, idx) => {
          if (m.isMe) return m;
          const waypoint =
            VILLAGE_ROAD_WAYPOINTS[(idx - 1 + VILLAGE_ROAD_WAYPOINTS.length) % VILLAGE_ROAD_WAYPOINTS.length];
          const jitterX = Math.round((Math.random() - 0.5) * 12);
          const jitterY = Math.round((Math.random() - 0.5) * 8);
          const nextX = Math.max(18, Math.min(82, waypoint.x + jitterX));
          const nextY = Math.max(44, Math.min(86, waypoint.y + jitterY));
          const movedDistance = Math.hypot(nextX - m.x, nextY - m.y);

          const postWalkMotions: CrewMotionType[] = ['idle', 'stretch', 'ready'];
          const nextMotion: CrewMotionType =
            movedDistance > 4
              ? 'walk'
              : postWalkMotions[Math.floor(Math.random() * postWalkMotions.length)];

          return {
            ...m,
            x: nextX,
            y: nextY,
            facing: nextX >= m.x ? 'right' : 'left',
            motion: nextMotion,
          };
        })
      );
    }, 2800);

    return () => {
      clearInterval(npcInterval);
      sub.unsubscribe();
    };
  }, []);

  const meMember = useMemo(
    () => members.find((m) => m.isMe) ?? members[0],
    [members]
  );
  const readyCount = useMemo(
    () => members.filter((m) => m.isReady).length,
    [members]
  );
  const synergy = useMemo(
    () => calculateCrewSynergyBonus(members.length, readyCount),
    [members.length, readyCount]
  );

  // 마을 길 터치 시 내 2D 만화 캐릭터가 팔다리를 흔들며 해당 위치로 이동
  function handleStageClick(e: MouseEvent<HTMLDivElement>) {
    if (!stageRef.current || isDeparting) return;
    const rect = stageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const boundedX = Math.max(18, Math.min(82, Math.round(clickX)));
    const boundedY = Math.max(44, Math.min(88, Math.round(clickY)));

    setClickTarget({ x: boundedX, y: boundedY });
    setMembers((prev) =>
      prev.map((m) =>
        m.isMe
          ? {
              ...m,
              facing: boundedX >= m.x ? 'right' : 'left',
              x: boundedX,
              y: boundedY,
              motion: 'walk',
            }
          : m
      )
    );
    channelRef.current?.broadcast({
      type: 'move',
      memberId: 'crew-me',
      x: boundedX,
      y: boundedY,
      motion: 'walk',
    });

    setTimeout(() => {
      setClickTarget(null);
      setMembers((prev) =>
        prev.map((m) =>
          m.isMe && m.motion === 'walk'
            ? { ...m, motion: m.isReady ? 'ready' : 'idle' }
            : m
        )
      );
    }, 950);
  }

  // 1. 함께 스트레칭 모션 (양팔을 머리 위로 들어 올리고 허리·무릎을 굽히는 실제 만화 동작)
  function handleGroupStretch() {
    setPlazaLog(
      '🧘 나와 크루원 캐릭터들이 양팔을 머리 위로 쭉 뻗으며 몸풀기 스트레칭 동작을 합니다!'
    );
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        motion: 'stretch',
        speechBubble: m.isMe ? '다 같이 스트레칭 해요! 🧘' : '하나 둘 셋 넷! 🧘',
      }))
    );
    channelRef.current?.broadcast({
      type: 'motion',
      memberId: 'crew-me',
      motion: 'stretch',
      speechBubble: '다 같이 스트레칭 해요! 🧘',
    });
  }

  // 2. 하이파이브 모션 (크루원 앞으로 달려가 서로 마주 보고 점프하며 손을 마주치는 동작)
  function handleHighFive() {
    const others = members.filter((m) => !m.isMe);
    const targetMate = others[0];
    if (!targetMate) return;

    const meetX = Math.max(24, Math.min(78, targetMate.x + 11));
    const meetY = targetMate.y;

    // 먼저 크루원 옆으로 달려가는 걷기 모션 실행 후 하이파이브 점프!
    setMembers((prev) =>
      prev.map((m) => {
        if (m.isMe) {
          return {
            ...m,
            x: meetX,
            y: meetY,
            facing: 'left',
            motion: 'walk',
          };
        }
        if (m.id === targetMate.id) {
          return {
            ...m,
            facing: 'right',
            motion: 'walk',
          };
        }
        return m;
      })
    );

    setTimeout(() => {
      setHighFiveEffect({ x: Math.round((meetX + targetMate.x) / 2), y: meetY - 12 });
      setPlazaLog(`🙌 ${targetMate.name} 님과 마주 보고 점프 하이파이브! 크루 사기가 충전되었습니다!`);
      setMembers((prev) =>
        prev.map((m) => {
          if (m.isMe) {
            return {
              ...m,
              facing: 'left',
              motion: 'highfive',
              speechBubble: `${targetMate.name} 하이파이브! 🙌⚡`,
            };
          }
          if (m.id === targetMate.id) {
            return {
              ...m,
              facing: 'right',
              motion: 'highfive',
              speechBubble: '오늘 완주 가즈아! 🙌🔥',
            };
          }
          return m;
        })
      );
    }, 450);

    setTimeout(() => {
      setHighFiveEffect(null);
    }, 2200);
  }

  // 3. 내 캐릭터 출발 준비 완료(READY) 제자리 피치 러닝 토글
  function handleToggleReady() {
    const nextReady = !meMember.isReady;
    setPlazaLog(
      nextReady
        ? '🔥 출발 준비 완료(READY)! 캐릭터가 제자리 피치 러닝으로 출발 대기 자세를 취합니다!'
        : '⏸️ 출발 준비 상태를 대기 모드로 전환했습니다.'
    );

    setMembers((prev) =>
      prev.map((m) =>
        m.isMe
          ? {
              ...m,
              isReady: nextReady,
              motion: nextReady ? 'ready' : 'idle',
              speechBubble: nextReady ? '출발 준비 완료! 🔥' : '잠시 장비 점검 중!',
            }
          : { ...m, isReady: true, motion: 'ready' }
      )
    );
    channelRef.current?.broadcast({
      type: 'ready',
      memberId: 'crew-me',
      isReady: nextReady,
      motion: nextReady ? 'ready' : 'idle',
    });
  }

  // 4. 빠른 응원 말풍선 외치기 (점프하며 손 흔들기)
  function handleQuickChat() {
    const msg = CREW_QUICK_CHATS[chatIndex % CREW_QUICK_CHATS.length];
    setChatIndex((prev) => prev + 1);
    setPlazaLog(`💬 [${myName}]: "${msg}"`);
    setMembers((prev) =>
      prev.map((m) => (m.isMe ? { ...m, speechBubble: msg, motion: 'highfive' } : m))
    );
  }

  // 5. 새로운 조깅 크루원 현장 합류 시뮬레이션
  function handleSummonCrewMate() {
    if (extraPoolIndex >= ADDITIONAL_CREW_POOL.length) {
      setPlazaLog('🎉 소속 조깅 크루원 전원(6명 풀파티)이 모두 마을 광장에 집결했습니다!');
      return;
    }
    const newMate = ADDITIONAL_CREW_POOL[extraPoolIndex];
    setExtraPoolIndex((prev) => prev + 1);
    setMembers((prev) => [...prev, newMate]);
    setPlazaLog(
      `🏃 [${newMate.name} • Lv.${newMate.level}] 크루원이 마을 입구에서 걸어 들어와 합류했습니다!`
    );
  }

  // 6. 크루 전원 동시 출발 모션 -> 러닝 맵 이동
  function handlePartyDepart() {
    setIsDeparting(true);
    setPlazaLog('🚀 크루 전원 팔다리를 힘차게 흔들며 마을 성문 쪽으로 함께 달려 나갑니다!');
    setMembers((prev) =>
      prev.map((m, idx) => ({
        ...m,
        x: 34 + idx * 5,
        y: 44,
        motion: 'walk',
        isReady: true,
        speechBubble: 'LET’S RUN!! 🚀💨',
      }))
    );
    setTimeout(() => {
      navigate('/map');
    }, 1200);
  }

  return (
    <div className="rounded-3xl border-2 border-emerald-500/40 bg-slate-900 text-white shadow-2xl overflow-hidden space-y-3 p-4">
      {/* 디즈니/2D 카툰 스켈레탈 관절 애니메이션 키프레임 */}
      <style>{`
        /* 자동 눈 깜빡임 */
        @keyframes cartoon-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        .rig-eyes {
          animation: cartoon-blink 3.6s infinite;
        }

        /* 1. IDLE (부드러운 만화 숨쉬기 & 팔/스카프 산들바람) */
        @keyframes idle-body-breathe {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-2.5px) scaleY(1.02); }
        }
        @keyframes idle-arm-sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes scarf-breeze {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(9deg) scaleX(1.05); }
        }
        .cartoon-rig-idle .rig-whole-body {
          animation: idle-body-breathe 2s ease-in-out infinite;
        }
        .cartoon-rig-idle .rig-arm-front {
          animation: idle-arm-sway 2s ease-in-out infinite;
        }
        .cartoon-rig-idle .rig-arm-back {
          animation: idle-arm-sway 2s ease-in-out infinite reverse;
        }
        .cartoon-rig-idle .rig-scarf,
        .cartoon-rig-idle .rig-cloak {
          animation: scarf-breeze 1.8s ease-in-out infinite;
        }

        /* 2. WALK / RUN (실제 만화처럼 양팔·양다리가 교차로 앞뒤 스윙하며 걸어가는 동작) */
        @keyframes walk-body-hop {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          25% { transform: translateY(-6px) rotate(5deg); }
          50% { transform: translateY(0px) rotate(3deg); }
          75% { transform: translateY(-6px) rotate(5deg); }
        }
        @keyframes walk-limb-swing-a {
          0%, 100% { transform: rotate(-36deg); }
          50% { transform: rotate(36deg); }
        }
        @keyframes walk-limb-swing-b {
          0%, 100% { transform: rotate(36deg); }
          50% { transform: rotate(-36deg); }
        }
        @keyframes walk-cloak-flutter {
          0%, 100% { transform: rotate(10deg); }
          50% { transform: rotate(24deg) scaleY(0.95); }
        }
        .cartoon-rig-walk .rig-whole-body {
          animation: walk-body-hop 0.56s linear infinite;
        }
        .cartoon-rig-walk .rig-leg-front {
          animation: walk-limb-swing-a 0.56s ease-in-out infinite;
        }
        .cartoon-rig-walk .rig-leg-back {
          animation: walk-limb-swing-b 0.56s ease-in-out infinite;
        }
        .cartoon-rig-walk .rig-arm-front {
          animation: walk-limb-swing-b 0.56s ease-in-out infinite;
        }
        .cartoon-rig-walk .rig-arm-back {
          animation: walk-limb-swing-a 0.56s ease-in-out infinite;
        }
        .cartoon-rig-walk .rig-scarf,
        .cartoon-rig-walk .rig-cloak {
          animation: walk-cloak-flutter 0.35s ease-in-out infinite;
        }

        /* 3. STRETCH (양팔을 머리 위로 들어 올리고 몸통과 무릎을 좌우로 굽히는 스트레칭 동작) */
        @keyframes stretch-torso-bend {
          0%, 100% { transform: translateY(2px) rotate(-11deg); }
          50% { transform: translateY(-3px) rotate(11deg); }
        }
        @keyframes stretch-arm-up-front {
          0%, 100% { transform: rotate(-135deg); }
          50% { transform: rotate(-158deg); }
        }
        @keyframes stretch-arm-up-back {
          0%, 100% { transform: rotate(-120deg); }
          50% { transform: rotate(-145deg); }
        }
        @keyframes stretch-leg-lunge {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
        .cartoon-rig-stretch .rig-whole-body {
          animation: stretch-torso-bend 1.1s ease-in-out infinite;
          transform-origin: 60px 120px;
        }
        .cartoon-rig-stretch .rig-arm-front {
          animation: stretch-arm-up-front 1.1s ease-in-out infinite;
        }
        .cartoon-rig-stretch .rig-arm-back {
          animation: stretch-arm-up-back 1.1s ease-in-out infinite;
        }
        .cartoon-rig-stretch .rig-leg-front {
          animation: stretch-leg-lunge 1.1s ease-in-out infinite;
        }
        .cartoon-rig-stretch .rig-leg-back {
          animation: stretch-leg-lunge 1.1s ease-in-out infinite reverse;
        }

        /* 4. HIGH-FIVE / CHEER (점프하며 오른팔을 높이 들어 손뼉을 마주치는 만화 동작) */
        @keyframes highfive-leap {
          0%, 100% { transform: translateY(0px) scale(1); }
          45% { transform: translateY(-18px) scale(1.05); }
          65% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes highfive-arm-slap {
          0%, 100% { transform: rotate(-45deg); }
          40%, 65% { transform: rotate(-140deg); }
        }
        @keyframes highfive-leg-kick {
          0%, 100% { transform: rotate(0deg); }
          45% { transform: rotate(-28deg); }
        }
        .cartoon-rig-highfive .rig-whole-body {
          animation: highfive-leap 0.72s ease-in-out infinite;
        }
        .cartoon-rig-highfive .rig-arm-front {
          animation: highfive-arm-slap 0.72s ease-in-out infinite;
        }
        .cartoon-rig-highfive .rig-arm-back {
          animation: highfive-arm-slap 0.72s ease-in-out infinite reverse;
        }
        .cartoon-rig-highfive .rig-leg-front {
          animation: highfive-leg-kick 0.72s ease-in-out infinite;
        }
        .cartoon-rig-highfive .rig-leg-back {
          animation: highfive-leg-kick 0.72s ease-in-out infinite reverse;
        }

        /* 5. READY (빠른 제자리 피치 러닝 & 팔 흔들기) */
        @keyframes ready-fast-step-a {
          0%, 100% { transform: rotate(-22deg) translateY(-3px); }
          50% { transform: rotate(22deg) translateY(0px); }
        }
        @keyframes ready-fast-step-b {
          0%, 100% { transform: rotate(22deg) translateY(0px); }
          50% { transform: rotate(-22deg) translateY(-3px); }
        }
        @keyframes ready-body-pulse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .cartoon-rig-ready .rig-whole-body {
          animation: ready-body-pulse 0.34s ease-in-out infinite;
        }
        .cartoon-rig-ready .rig-leg-front {
          animation: ready-fast-step-a 0.34s linear infinite;
        }
        .cartoon-rig-ready .rig-leg-back {
          animation: ready-fast-step-b 0.34s linear infinite;
        }
        .cartoon-rig-ready .rig-arm-front {
          animation: ready-fast-step-b 0.34s linear infinite;
        }
        .cartoon-rig-ready .rig-arm-back {
          animation: ready-fast-step-a 0.34s linear infinite;
        }
      `}</style>

      {/* 1. 상단 크루 타운 광장 헤더 & 실시간 파티 시너지 버프 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              2D Cartoon Character Rig • Village Town Plaza
            </span>
          </div>
          <h2 className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
            <span>🏘️</span>
            <span>BGC 조깅 크루 집결 광장 ({members.length}명 모임)</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSummonCrewMate}
            disabled={extraPoolIndex >= ADDITIONAL_CREW_POOL.length}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black shadow-md active:scale-95 transition-all cursor-pointer"
          >
            ➕ 크루원 현장 합류 ({members.length}/6)
          </button>
          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
            READY {readyCount}/{members.length}
          </span>
        </div>
      </div>

      {/* 크루 집결 시너지 버프 표시줄 */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-indigo-950/90 border border-emerald-500/30 px-3 py-2 flex items-center justify-between text-[11px]">
        <span className="font-black text-emerald-300">{synergy.partyGrade}</span>
        <div className="flex items-center gap-2 font-bold">
          <span className="text-amber-300">⚡ 파티 XP +{synergy.xpBonusPercent}%</span>
          <span className="text-sky-300">🛡️ 스태미나 소모 -{synergy.staminaSavePercent}%</span>
        </div>
      </div>

      {/* 2. 메인 2D 판타지 마을 광장 배경 + 관절이 살아 움직이는 2D 만화 캐릭터들 */}
      <div
        ref={stageRef}
        onClick={handleStageClick}
        data-testid="crew-town-plaza-stage"
        className={`relative w-full ${
          compact ? 'h-80' : 'h-96'
        } rounded-2xl overflow-hidden cursor-pointer select-none border-2 border-amber-200/40 shadow-inner bg-sky-200`}
      >
        {/* 고정된 2D 만화풍 마을 광장 일러스트 배경 (캐릭터와 분리되어 흔들리지 않음) */}
        <img
          src="/images/town-plaza-bg.jpg"
          alt="Adventure Town Plaza"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/20 pointer-events-none" />

        {/* 상단 마을 출발 성문 안내 뱃지 */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-xs border border-amber-300/60 shadow-lg flex items-center gap-1.5 pointer-events-none">
          <span>🏰</span>
          <span className="text-[10px] font-black text-amber-200 tracking-wider uppercase">
            탐험가 마을 집결 광장 (길 터치 시 걸어서 이동)
          </span>
        </div>

        {/* 바닥 클릭 이동 마커 */}
        {clickTarget && (
          <div
            style={{ left: `${clickTarget.x}%`, top: `${clickTarget.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-4 rounded-full border-2 border-emerald-300 bg-emerald-400/40 animate-ping pointer-events-none z-10"
          />
        )}

        {/* 하이파이브 스파크 이펙트 */}
        {highFiveEffect && (
          <div
            style={{ left: `${highFiveEffect.x}%`, top: `${highFiveEffect.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce"
          >
            <div className="px-3 py-1 rounded-full bg-amber-400 border-2 border-slate-900 text-slate-950 text-[11px] font-black shadow-xl">
              🙌 짝!! HIGH-FIVE! ⚡
            </div>
          </div>
        )}

        {/* 마을 길 위에서 팔다리를 움직이며 돌아다니는 2D 만화 캐릭터들 (투명 배경) */}
        {members.map((member) => {
          // 원근감 스케일: 마을 위쪽(분수대 너머)은 작게, 아래쪽(전경 길)은 크게 표현
          const depthScale = Number((0.68 + (member.y / 100) * 0.42).toFixed(2));
          return (
            <div
              key={member.id}
              style={{
                left: `${member.x}%`,
                top: `${member.y}%`,
                zIndex: Math.round(member.y),
                transform: `translate(-50%, -82%) scale(${depthScale})`,
              }}
              className="absolute transition-[left,top,transform] duration-900 ease-in-out flex flex-col items-center pointer-events-none"
            >
              {/* 머리 위 실시간 말풍선 */}
              {member.speechBubble && (
                <div className="mb-0.5 px-2.5 py-0.5 rounded-2xl bg-white/95 text-slate-900 text-[10px] font-black shadow-md border-2 border-slate-800 whitespace-nowrap max-w-[155px] truncate">
                  {member.speechBubble}
                </div>
              )}

              {/* 실제 팔·다리·몸통·머리카락·스카프가 관절별로 움직이는 2D 만화 캐릭터 */}
              <AnimatedCartoonRunner
                motion={member.motion}
                facing={member.facing}
                level={member.level}
                tierNumber={member.tierNumber}
                isReady={member.isReady}
                isMe={member.isMe}
                appearance={member.appearance}
              />

              {/* 캐릭터 이름 · 레벨 · 착용 의상 태그 */}
              <div
                className={`-mt-1 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap shadow-md border ${
                  member.isMe
                    ? 'bg-amber-400 text-slate-950 border-slate-900'
                    : 'bg-slate-950/90 text-white border-white/30'
                }`}
              >
                {member.isMe ? `👑 나 (${member.name})` : member.name} • Lv.{member.level}
              </div>
            </div>
          );
        })}

        {/* 하단 실시간 모션 상태 안내 바 */}
        <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] text-white bg-slate-950/75 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 pointer-events-none z-40">
          <span className="truncate font-bold">{plazaLog}</span>
          <span className="font-black text-amber-300 shrink-0 ml-2">마을 길 터치 이동 👆</span>
        </div>
      </div>

      {/* 3. 실시간 2D 만화 캐릭터 모션 컨트롤 바 */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={handleGroupStretch}
          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-black text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🧘</span>
          <span>함께 스트레칭</span>
        </button>

        <button
          type="button"
          onClick={handleHighFive}
          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-black text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🙌</span>
          <span>하이파이브</span>
        </button>

        <button
          type="button"
          onClick={handleQuickChat}
          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-black text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">💬</span>
          <span>응원 외치기</span>
        </button>

        <button
          type="button"
          onClick={handleToggleReady}
          className={`py-2 px-2 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
            meMember.isReady
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
              : 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950'
          }`}
        >
          <span className="text-base">🔥</span>
          <span>{meMember.isReady ? 'READY 완료' : '준비 완료'}</span>
        </button>
      </div>

      {/* 4. 크루 전원 퀘스트 동시 출발 버튼 */}
      <button
        type="button"
        onClick={handlePartyDepart}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>🚀</span>
        <span>
          크루 파티 동시 퀘스트 출발! (파티 보너스 XP +{synergy.xpBonusPercent}% 적용)
        </span>
      </button>
    </div>
  );
}
