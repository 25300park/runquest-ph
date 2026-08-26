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

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'guilds'>('feed');
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>(initialFeedItems);
  const [activeBuffEffect, setActiveBuffEffect] = useState<{ id: string; type: 'energy' | 'potion' } | null>(null);

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
    // 1. 파티클 애니메이션 트리거
    setActiveBuffEffect({ id: feedId, type: buffType });
    setTimeout(() => setActiveBuffEffect(null), 1000);

    // 2. 낙관적 UI 업데이트
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
      {/* 1. 상단 타이틀 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
          City Community & Feed
        </p>
        <h1 className="mt-0.5 text-2xl font-black text-slate-900">Run with your city crew</h1>
        <p className="mt-1 text-xs text-slate-500">
          Share your quests, cheer fellow runners with RPG buffs, and build crew glory.
        </p>
      </div>

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
              {/* 파티클 애니메이션 오버레이 */}
              {activeBuffEffect?.id === item.id && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center bg-violet-600/10 backdrop-blur-[1px] animate-in fade-in zoom-in duration-300">
                  <span className="text-4xl animate-bounce">
                    {activeBuffEffect.type === 'energy' ? '⚡ +50 ENERGY!' : '🧪 +100 EXP BUFF!'}
                  </span>
                </div>
              )}

              {/* 피드 헤더: 아바타 + 이름 + 시간 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-violet-500/20 border-2 border-white">
                    {item.avatar}
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

              {/* 미니 궤적 프리뷰 박스 (SVG 렌더링) */}
              <div className="mt-2.5 h-16 w-full rounded-xl bg-slate-900/5 border border-slate-200/60 flex items-center justify-center relative overflow-hidden">
                <svg className="w-full h-full p-2 text-violet-600 stroke-current fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 100 40">
                  <path d="M 10 30 Q 30 5 50 20 T 90 10" />
                </svg>
                <span className="absolute right-2 bottom-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-white/80 px-1.5 py-0.5 rounded shadow-xs">
                  GPS Route Verified
                </span>
              </div>

              {/* 하단 RPG 상호 버프 액션 버튼 */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendBuff(item.id, 'energy')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    item.hasEnergized
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-sm">⚡</span>
                  <span>Send Energy ({item.energyCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendBuff(item.id, 'potion')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    item.hasPotioned
                      ? 'bg-violet-100 text-violet-900 border border-violet-300 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-sm">🧪</span>
                  <span>Drop Potion ({item.potionCount})</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 4. [TAB 2] 길드 & 크루 뷰 */}
      {activeTab === 'guilds' && (
        <div className="space-y-4">
          {/* 상위 챔피언 길드 카드 */}
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

          {/* 새 길드 창설 폼 */}
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

          {/* 길드 목록 */}
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
