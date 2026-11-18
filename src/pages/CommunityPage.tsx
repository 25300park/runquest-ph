import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureUserProfile } from '../services/authService';
import { getCharacterProfile } from '../services/characterService';
import {
  createGuild,
  joinGuild,
  listGuildMembers,
  listGuilds,
  subscribeToGuilds,
  type GuildMemberRow,
  type GuildRow,
} from '../services/guildService';
import { initialFeedItems, type ActivityFeedItem } from '../data/mockFeed';
import CrewTownPlaza from '../components/crew/CrewTownPlaza';
import FactionWarsCard from '../components/faction/FactionWarsCard';

type GuildWithMembers = GuildRow & {
  members: GuildMemberRow[];
};

interface LiveStoryRunner {
  id: string;
  name: string;
  avatar: string;
  pace: string;
  area: string;
  distance: string;
  isLive: boolean;
}

const liveStoryRunners: LiveStoryRunner[] = [
  { id: 'story-1', name: 'ShadowTiger', avatar: '/images/avatars/4.png', pace: '4:45/km', area: 'BGC Greenway', distance: '4.2 km', isLive: true },
  { id: 'story-2', name: 'CyberRabbit', avatar: '/images/avatars/8.webm', pace: '4:20/km', area: 'High Street Loop', distance: '5.8 km', isLive: true },
  { id: 'story-3', name: 'MakatiWolf', avatar: '/images/avatars/11.png', pace: '5:10/km', area: 'Ayala Triangle', distance: '3.5 km', isLive: true },
  { id: 'story-4', name: 'GoldenFox', avatar: '/images/avatars/15.png', pace: '4:55/km', area: 'Terra 28th Park', distance: '2.9 km', isLive: true },
  { id: 'story-5', name: 'NeonPanther', avatar: '/images/avatars/19.png', pace: '4:30/km', area: 'Legazpi Active', distance: '6.1 km', isLive: true },
  { id: 'story-6', name: 'SkyFalcon', avatar: '/images/avatars/22.png', pace: '4:15/km', area: 'MOA Seaside', distance: '7.4 km', isLive: true },
];

const INITIAL_CREW_ROSTER = [
  {
    id: 'member-1',
    name: '민지 (Minji)',
    role: 'Sub-Leader • Explorer',
    level: 4,
    weeklyKm: 24.5,
    tierLabel: 'Tier 2 • 트레일 조끼 & 고글',
    statusText: '마을 분수대 산책 중',
  },
  {
    id: 'member-2',
    name: '현우 (Hyunwoo)',
    role: 'Pacer • Challenger',
    level: 7,
    weeklyKm: 38.2,
    tierLabel: 'Tier 3 • 엘리트 윈드브레이커',
    statusText: '광장 집결 완료',
  },
  {
    id: 'member-3',
    name: '소연 (Soyeon)',
    role: 'Legend • Guardian',
    level: 10,
    weeklyKm: 52.0,
    tierLabel: 'Tier 4 • 마스터 황금 망토',
    statusText: '출발 대기 중',
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'plaza' | 'manage' | 'feed'>('plaza');
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>(initialFeedItems);
  const [floatingParticles, setFloatingParticles] = useState<
    { id: number; feedId: string; icon: string; x: number; y: number }[]
  >([]);
  const [selectedStory, setSelectedStory] = useState<LiveStoryRunner | null>(null);

  // 내 소속 크루 설정 상태
  const [myCrewName, setMyCrewName] = useState(() => {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem('runquest-my-crew-name') || 'BGC Night Striders'
      : 'BGC Night Striders';
  });
  const [crewNotice, setCrewNotice] = useState(() => {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem('runquest-my-crew-notice') ||
          '오늘 저녁 8시 BGC 하이스트리트 분수대 앞 5km 그룹런 집결!'
      : '오늘 저녁 8시 BGC 하이스트리트 분수대 앞 5km 그룹런 집결!';
  });
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // 길드 관련 상태
  const [guilds, setGuilds] = useState<GuildWithMembers[]>([]);
  const [status, setStatus] = useState('Loading live guilds...');
  const [loading, setLoading] = useState(true);
  const [guildName, setGuildName] = useState('');

  async function loadGuilds() {
    try {
      const nextGuilds = await listGuilds();
      const guildMembers = await Promise.all(
        nextGuilds.map(async (guild) => ({
          ...guild,
          members: await listGuildMembers(guild.id),
        }))
      );
      setGuilds(guildMembers);
      setStatus(
        guildMembers.length === 0
          ? 'No guilds yet. Create the first city crew.'
          : 'Live guild sync active.'
      );
    } catch (error) {
      setGuilds([]);
      setStatus(error instanceof Error ? error.message : 'Could not load live guilds.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGuilds();
    const unsubscribe = subscribeToGuilds(() => void loadGuilds());
    return () => {
      unsubscribe();
    };
  }, []);

  const topGuild = useMemo(
    () => guilds.slice().sort((first, second) => second.total_xp - first.total_xp)[0],
    [guilds]
  );

  function handleSaveCrewSettings() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('runquest-my-crew-name', myCrewName.trim() || 'BGC Night Striders');
      window.localStorage.setItem('runquest-my-crew-notice', crewNotice.trim());
    }
    setIsEditingNotice(false);
  }

  function handleSendBuff(feedId: string, buffType: 'energy' | 'potion') {
    const iconPrimary = buffType === 'energy' ? '🥕' : '🧪';
    const iconSecondary = buffType === 'energy' ? '⚡' : '✨';
    const newParticles = [
      { id: Date.now() + 1, feedId, icon: iconPrimary, x: -30, y: -40 },
      { id: Date.now() + 2, feedId, icon: iconSecondary, x: -10, y: -65 },
      { id: Date.now() + 3, feedId, icon: '💥', x: 10, y: -50 },
      { id: Date.now() + 4, feedId, icon: buffType === 'energy' ? '⚡' : '🌟', x: 30, y: -45 },
    ];
    setFloatingParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1400);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        /* ignore */
      }
    }

    setFeedItems((current) =>
      current.map((item) => {
        if (item.id !== feedId) return item;
        if (buffType === 'energy') {
          return {
            ...item,
            energyCount: item.hasEnergized ? item.energyCount - 1 : item.energyCount + 1,
            hasEnergized: !item.hasEnergized,
          };
        } else {
          return {
            ...item,
            potionCount: item.hasPotioned ? item.potionCount - 1 : item.potionCount + 1,
            hasPotioned: !item.hasPotioned,
          };
        }
      })
    );
  }

  async function handleCreateGuild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guildName.trim()) return;

    try {
      setStatus('Creating guild...');
      const profile = await ensureUserProfile();
      const character = await getCharacterProfile();
      await createGuild({
        name: guildName.trim(),
        leaderId: profile.id,
        characterId: character?.character.id ?? null,
      });
      setMyCrewName(guildName.trim());
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('runquest-my-crew-name', guildName.trim());
      }
      setGuildName('');
      await loadGuilds();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create guild.');
    }
  }

  async function handleJoinGuild(guildId: string, selectedName?: string) {
    try {
      setStatus('Joining guild...');
      if (selectedName) {
        setMyCrewName(selectedName);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('runquest-my-crew-name', selectedName);
        }
      }
      const profile = await ensureUserProfile();
      const character = await getCharacterProfile();
      await joinGuild({
        guildId,
        userId: profile.id,
        characterId: character?.character.id ?? null,
      });
      await loadGuilds();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not join guild.');
    }
  }

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-4 text-slate-900 font-sans pb-28 select-none">
      {/* 1. 상단 크루 통합 허브 헤더 */}
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 text-white shadow-xl border border-emerald-500/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Crew Hub • Plaza & Management
              </span>
            </div>
            <h1 className="text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
              <span>🏕️</span>
              <span>{myCrewName}</span>
            </h1>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
              ⚡ 파티 버프 +15% XP
            </span>
            <p className="text-[10px] text-slate-300 font-bold mt-1">
              크루원 4명 마을 광장 집결 중
            </p>
          </div>
        </div>

        {/* 크루 한줄 공지 바 */}
        <div className="mt-3 rounded-2xl bg-slate-950/70 border border-white/10 px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <p className="text-[11px] text-amber-200 font-bold truncate">
            📢 {crewNotice}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manage');
              setIsEditingNotice(true);
            }}
            className="text-[10px] font-black text-emerald-300 hover:underline shrink-0 cursor-pointer"
          >
            공지 수정
          </button>
        </div>
      </header>

      {/* 2. 3종 통합 탭 스위치: [🏕️ 크루 집결 광장] / [🏰 크루 관리·진영전] / [🔥 레이드·피드] */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('plaza')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'plaza'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏕️</span>
          <span>집결 광장</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'manage'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏰</span>
          <span>크루 관리</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🔥</span>
          <span>레이드·피드</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* [TAB 1] 🏕️ 실시간 2D 카툰 크루 집결 광장 (Crew Town Plaza) */}
      {/* ================================================================= */}
      {activeTab === 'plaza' && (
        <div className="space-y-4">
          {/* 메인 2D 만화 캐릭터 마을 집결 광장 */}
          <CrewTownPlaza />

          {/* 광장에 집결한 내 크루원 현황 & 빠른 교감 카드 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>👥</span>
                  <span>광장 집결 크루원 명단 ({INITIAL_CREW_ROSTER.length + 1}명)</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  같은 소속 조깅 크루원들의 레벨별 장착 의상과 주간 러닝 기여도입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 text-[10px] font-black border border-violet-200 cursor-pointer"
              >
                크루 설정 →
              </button>
            </div>

            <div className="space-y-2">
              {INITIAL_CREW_ROSTER.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-black text-slate-900">{member.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">
                        Lv.{member.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {member.role} • {member.tierLabel}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-700">
                      {member.weeklyKm.toFixed(1)} km
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold">이번 주 누적</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 오프라인 레이드 집결 바로가기 배너 */}
            <Link
              to="/raid"
              className="block rounded-2xl p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/50 shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🐆</span>
                  <div>
                    <span className="text-[9px] font-black uppercase text-amber-300">
                      O2O 현장 GPS 레이드
                    </span>
                    <p className="text-xs font-black text-white">
                      광장 집결 후 BGC 현장 레이드 출발하기 (+500 XP)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-cyan-300 shrink-0">입장 →</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* [TAB 2] 🏰 크루 관리 & 주간 도시 진영전 (Crew Management & Guilds) */}
      {/* ================================================================= */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* 내 소속 크루 관리 카드 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>⚙️</span>
                <span>내 소속 크루 관리 ({myCrewName})</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingNotice((prev) => !prev)}
                className="text-xs font-black text-violet-600 hover:underline cursor-pointer"
              >
                {isEditingNotice ? '취소' : '편집'}
              </button>
            </div>

            {isEditingNotice ? (
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    소속 크루 이름
                  </span>
                  <input
                    type="text"
                    value={myCrewName}
                    onChange={(e) => setMyCrewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    크루 집결 공지사항
                  </span>
                  <input
                    type="text"
                    value={crewNotice}
                    onChange={(e) => setCrewNotice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveCrewSettings}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  크루 설정 저장
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">크루 등급</p>
                  <p className="text-xs font-black text-emerald-700 mt-0.5">Lv.5 Gold Crew</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">주간 합산 거리</p>
                  <p className="text-xs font-black text-slate-900 mt-0.5">128.4 km</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">크루 파티 버프</p>
                  <p className="text-xs font-black text-violet-700 mt-0.5">+15% XP</p>
                </div>
              </div>
            )}
          </div>

          {/* 마카티 vs BGC 주간 대규모 진영전 */}
          <FactionWarsCard />

          {/* 도시 챔피언 길드 배너 */}
          {topGuild && (
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    👑 City Champion Guild
                  </span>
                  <h3 className="mt-1 text-base font-black text-slate-900">{topGuild.name}</h3>
                </div>
                <span className="text-lg font-black text-amber-600">{topGuild.total_xp} XP</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Active crew leading the leaderboards across Metro Manila.
              </p>
            </div>
          )}

          {/* 신규 크루 창설 폼 */}
          <form
            onSubmit={handleCreateGuild}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"
          >
            <h2 className="text-sm font-black text-slate-900">Found a New City Crew (신규 크루 창설)</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                placeholder="Crew name (e.g. BGC Night Striders)"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 font-bold text-xs text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                Create Crew
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{status}</p>
          </form>

          {/* 전체 크루 목록 */}
          <div className="grid gap-3">
            {loading && (
              <div className="rounded-2xl bg-white p-6 text-center text-xs font-bold text-slate-400 border border-slate-100">
                Loading live guilds...
              </div>
            )}
            {guilds.map((guild) => (
              <article
                key={guild.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-900">{guild.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {guild.members.length} members ·{' '}
                    <span className="font-bold text-violet-600">{guild.total_xp} XP</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleJoinGuild(guild.id, guild.name)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  Join Crew
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* [TAB 3] 🔥 오프라인 크루 레이드 & 실시간 러닝 피드 */}
      {/* ================================================================= */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* O2O 오프라인 크루 레이드 카드 */}
          <Link
            to="/raid"
            className="block rounded-3xl p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/60 shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg flex items-center justify-center text-2xl shrink-0">
                  🐆
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                    🔥 O2O Offline Raid
                  </span>
                  <h3 className="text-sm font-black text-white mt-1">BGC Midnight Cyber Raid</h3>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    50m 현장 체크인 시 +500 XP & 전설 뱃지 지급!
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-cyan-300 bg-cyan-950/80 px-3 py-1.5 rounded-xl border border-cyan-500/40 shrink-0">
                참가하기 →
              </span>
            </div>
          </Link>

          {/* 상단 인스타그램 스토리형 라이브 러너 링 */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Live Runners in Metro Manila
              </h2>
              <span className="text-[10px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                {liveStoryRunners.length} Active
              </span>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar pt-1">
              {liveStoryRunners.map((runner) => (
                <button
                  key={runner.id}
                  type="button"
                  onClick={() => setSelectedStory(runner)}
                  className="flex flex-col items-center shrink-0 group cursor-pointer active:scale-95 transition-all text-left"
                >
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 shadow-md">
                    <div className="w-13 h-13 rounded-full bg-white p-0.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-sky-300 to-emerald-300 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                        {runner.avatar.endsWith('.webm') ? (
                          <video
                            src={runner.avatar}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={runner.avatar}
                            alt={runner.name}
                            className="w-full h-full object-contain filter drop-shadow-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="mt-1.5 text-[11px] font-black text-slate-900 truncate max-w-[66px]">
                    {runner.name}
                  </span>
                  <span className="text-[9px] font-black text-emerald-600">{runner.pace}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 크루 러닝 인증 피드 */}
          <div className="space-y-3.5">
            {feedItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center p-1 shadow-md shadow-violet-500/20 border-2 border-white overflow-hidden">
                      <img
                        src={item.avatar}
                        alt={item.userName}
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{item.userName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {item.area} · {item.createdAt}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                    +{item.xpEarned} XP
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                  <div className="mt-2 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Distance</p>
                      <p className="font-black text-base text-slate-900 mt-0.5">
                        {item.distanceKm.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-500">km</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Pace</p>
                      <p className="font-black text-base text-violet-700 mt-0.5">
                        {item.paceMinKm} <span className="text-[10px] text-slate-500">/km</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Time</p>
                      <p className="font-black text-base text-amber-600 mt-0.5">
                        {item.durationMinutes}{' '}
                        <span className="text-[10px] text-slate-500">min</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 relative">
                  {floatingParticles
                    .filter((p) => p.feedId === item.id)
                    .map((particle) => (
                      <span
                        key={particle.id}
                        style={{
                          transform: `translate(${particle.x}px, ${particle.y}px)`,
                          transition: 'all 0.8s ease-out',
                        }}
                        className="absolute left-1/2 text-2xl pointer-events-none animate-bounce z-20"
                      >
                        {particle.icon}
                      </span>
                    ))}

                  <button
                    type="button"
                    onClick={() => handleSendBuff(item.id, 'energy')}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 border cursor-pointer ${
                      item.hasEnergized
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                        : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200/70'
                    }`}
                  >
                    <span className="text-base">🥕</span>
                    <span>⚡ 당근 ({item.energyCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendBuff(item.id, 'potion')}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 border cursor-pointer ${
                      item.hasPotioned
                        ? 'bg-violet-100 text-violet-900 border-violet-300 shadow-sm'
                        : 'bg-violet-50/70 hover:bg-violet-100 text-violet-800 border-violet-200/70'
                    }`}
                  >
                    <span className="text-base">🧪</span>
                    <span>물약 ({item.potionCount})</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 라이브 러너 스토리 팝업 모달 */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black active:scale-95"
            >
              ✕
            </button>
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-400 p-1 mx-auto flex items-center justify-center shadow-md border-2 border-emerald-300">
              {selectedStory.avatar.endsWith('.webm') ? (
                <video
                  src={selectedStory.avatar}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedStory.avatar}
                  alt={selectedStory.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <h3 className="mt-3 text-base font-black text-slate-900">{selectedStory.name}</h3>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              🔥 Live Running Now
            </span>
            <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl text-left text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400">Current Zone</p>
                <p className="font-black text-slate-800 truncate">{selectedStory.area}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">Live Pace</p>
                <p className="font-black text-violet-600">{selectedStory.pace}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 text-white font-black text-xs shadow-md shadow-violet-500/20 active:scale-95"
            >
              Send High-Five 👋
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
