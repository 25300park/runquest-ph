import { useEffect, useMemo, useState } from 'react';
import { ensureUserProfile } from '../services/authService';
import { getCharacterProfile } from '../services/characterService';
import {
  createGuild,
  joinGuild,
  listGuildMembers,
  listGuilds,
  subscribeToGuilds,
  type GuildMemberRow,
  type GuildRow
} from '../services/guildService';
import { initialFeedItems, type ActivityFeedItem } from '../data/mockFeed';

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
  { id: 'story-6', name: 'SkyFalcon', avatar: '/images/avatars/22.png', pace: '4:15/km', area: 'MOA Seaside', distance: '7.4 km', isLive: true }
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'guilds'>('feed');
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>(initialFeedItems);
  const [floatingParticles, setFloatingParticles] = useState<{ id: number; feedId: string; icon: string; x: number; y: number }[]>([]);
  const [selectedStory, setSelectedStory] = useState<LiveStoryRunner | null>(null);

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
          members: await listGuildMembers(guild.id)
        }))
      );
      setGuilds(guildMembers);
      setStatus(guildMembers.length === 0 ? 'No guilds yet. Create the first city crew.' : 'Live guild sync active.');
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

  function handleSendBuff(feedId: string, buffType: 'energy' | 'potion') {
    // 1. 화려한 플로팅 파티클 마이크로 인터랙션 생성 (⚡/🥕/🧪/✨)
    const iconPrimary = buffType === 'energy' ? '🥕' : '🧪';
    const iconSecondary = buffType === 'energy' ? '⚡' : '✨';
    const newParticles = [
      { id: Date.now() + 1, feedId, icon: iconPrimary, x: -30, y: -40 },
      { id: Date.now() + 2, feedId, icon: iconSecondary, x: -10, y: -65 },
      { id: Date.now() + 3, feedId, icon: '💥', x: 10, y: -50 },
      { id: Date.now() + 4, feedId, icon: buffType === 'energy' ? '⚡' : '🌟', x: 30, y: -45 }
    ];
    setFloatingParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1400);

    // 2. 진동 햅틱 피드백 (모바일 지원 시)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(40); } catch { /* ignore */ }
    }

    // 3. 낙관적 UI 업데이트
    setFeedItems((current) =>
      current.map((item) => {
        if (item.id !== feedId) return item;
        if (buffType === 'energy') {
          return {
            ...item,
            energyCount: item.hasEnergized ? item.energyCount - 1 : item.energyCount + 1,
            hasEnergized: !item.hasEnergized
          };
        } else {
          return {
            ...item,
            potionCount: item.hasPotioned ? item.potionCount - 1 : item.potionCount + 1,
            hasPotioned: !item.hasPotioned
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
        characterId: character?.character.id ?? null
      });
      setGuildName('');
      await loadGuilds();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create guild.');
    }
  }

  async function handleJoinGuild(guildId: string) {
    try {
      setStatus('Joining guild...');
      const profile = await ensureUserProfile();
      const character = await getCharacterProfile();
      await joinGuild({
        guildId,
        userId: profile.id,
        characterId: character?.character.id ?? null
      });
      await loadGuilds();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not join guild.');
    }
  }

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-24 select-none">
      {/* 1. 상단 인스타그램 스토리형 라이브 러너 링 */}
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

        {/* 가로 스크롤 스토리 아바타 */}
        <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {liveStoryRunners.map((runner) => (
            <button
              key={runner.id}
              type="button"
              onClick={() => setSelectedStory(runner)}
              className="flex flex-col items-center shrink-0 group cursor-pointer active:scale-95 transition-all text-left"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 shadow-md animate-pulse">
                <div className="w-13 h-13 rounded-full bg-white p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-sky-300 to-emerald-300 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                    {runner.avatar.endsWith('.webm') ? (
                      <video src={runner.avatar} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                    ) : (
                      <img src={runner.avatar} alt={runner.name} className="w-full h-full object-contain filter drop-shadow-xs" />
                    )}
                  </div>
                </div>
              </div>
              <span className="mt-1.5 text-[11px] font-black text-slate-900 truncate max-w-[66px]">
                {runner.name}
              </span>
              <span className="text-[9px] font-black text-emerald-600">
                {runner.pace}
              </span>
            </button>
          ))}
        </div>
      </div>

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
                <video src={selectedStory.avatar} autoPlay loop muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={selectedStory.avatar} alt={selectedStory.name} className="w-full h-full object-contain" />
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

      {/* 2. 탭 전환 버튼 (Feed vs Guilds) */}
      <div className="flex gap-2 p-1 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'feed'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🔥</span>
          <span>Activity Feed</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guilds')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'guilds'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏰</span>
          <span>City Guilds ({guilds.length})</span>
        </button>
      </div>

      {/* 3. [TAB 1] 러닝 피드 & RPG 상호 버프 스트림 */}
      {activeTab === 'feed' && (
        <div className="space-y-3.5">
          {feedItems.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
            >
              {/* 피드 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center p-1 shadow-md shadow-violet-500/20 border-2 border-white overflow-hidden">
                    <img src={item.avatar} alt={item.userName} className="w-full h-full object-contain filter drop-shadow-xs" />
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

              {/* 피드 본문: 타이틀 & 스탯 */}
              <div className="mt-3">
                <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                <div className="mt-2 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Distance</p>
                    <p className="font-black text-base text-slate-900 mt-0.5">{item.distanceKm.toFixed(2)} <span className="text-[10px] text-slate-500">km</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Pace</p>
                    <p className="font-black text-base text-violet-700 mt-0.5">{item.paceMinKm} <span className="text-[10px] text-slate-500">/km</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Time</p>
                    <p className="font-black text-base text-amber-600 mt-0.5">{item.durationMinutes} <span className="text-[10px] text-slate-500">min</span></p>
                  </div>
                </div>
              </div>

              {/* 미니 궤적 프리뷰 박스 */}
              <div className="mt-2.5 h-16 w-full rounded-xl bg-slate-900/5 border border-slate-200/60 flex items-center justify-center relative overflow-hidden">
                <svg className="w-full h-full p-2 text-violet-600 stroke-current fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 100 40">
                  <path d="M 10 30 Q 30 5 50 20 T 90 10" />
                </svg>
                <span className="absolute right-2 bottom-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-white/80 px-1.5 py-0.5 rounded shadow-xs">
                  GPS Route Verified
                </span>
              </div>

              {/* 하단 RPG 상호 버프 액션 버튼 (⚡ 당근 & 🧪 물약) */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 relative">
                {/* 솟구치는 플로팅 파티클 렌더링 */}
                {floatingParticles
                  .filter((p) => p.feedId === item.id)
                  .map((particle) => (
                    <span
                      key={particle.id}
                      style={{
                        transform: `translate(${particle.x}px, ${particle.y}px)`,
                        transition: 'all 0.8s ease-out'
                      }}
                      className="absolute left-1/2 text-2xl pointer-events-none animate-bounce z-20"
                    >
                      {particle.icon}
                    </span>
                  ))}

                {/* [⚡ 당근(에너지)] 버프 버튼 */}
                <button
                  type="button"
                  onClick={() => handleSendBuff(item.id, 'energy')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 border ${
                    item.hasEnergized
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                      : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200/70'
                  }`}
                >
                  <span className="text-base">🥕</span>
                  <span>⚡ 당근 ({item.energyCount})</span>
                </button>

                {/* [🧪 물약(XP)] 버프 버튼 */}
                <button
                  type="button"
                  onClick={() => handleSendBuff(item.id, 'potion')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 border ${
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
      )}

      {/* 4. [TAB 2] 길드 & 크루 뷰 */}
      {activeTab === 'guilds' && (
        <div className="space-y-4">
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

          <form
            onSubmit={handleCreateGuild}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"
          >
            <h2 className="text-sm font-black text-slate-900">Found a New City Crew</h2>
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
                className="rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 font-bold text-xs text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all shrink-0"
              >
                Create Crew
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{status}</p>
          </form>

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
                    {guild.members.length} members · <span className="font-bold text-violet-600">{guild.total_xp} XP</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleJoinGuild(guild.id)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 active:scale-95 transition-all"
                >
                  Join Crew
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
