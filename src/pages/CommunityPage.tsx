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

type GuildWithMembers = GuildRow & {
  members: GuildMemberRow[];
};

export default function CommunityPage() {
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
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-12 select-none">
      {/* 1. 상단 히어로 배너 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">Live crew board</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Run with your city crew</h1>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          Create guilds, join crews, and build shared XP from real RunQuest activity.
        </p>
        <p className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs font-bold text-slate-700">{status}</p>
      </div>

      {/* 2. 크루 생성 폼 */}
      <form onSubmit={(event) => void handleCreateGuild(event)} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-black uppercase text-violet-600">Create guild</p>
        <div className="mt-2.5 flex gap-2">
          <input
            value={guildName}
            onChange={(event) => setGuildName(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
            placeholder="BGC Night Runners"
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all">
            Create
          </button>
        </div>
      </form>

      {/* 3. 크루 랭킹 리스트 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2">Guild Leaderboard</h2>
        {loading && <p className="mt-2 rounded-2xl bg-white border border-slate-100 p-4 text-xs font-bold text-slate-400">Loading guilds...</p>}
        {!loading && guilds.length === 0 && (
          <p className="mt-2 rounded-2xl bg-white border border-slate-100 p-4 text-xs font-bold text-slate-400">No guilds found.</p>
        )}
        <div className="mt-2 grid gap-2.5">
          {guilds.map((guild, index) => (
            <article key={guild.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-violet-600">Rank #{index + 1}</p>
                  <h3 className="mt-0.5 text-base font-black text-slate-900">{guild.name}</h3>
                  <p className="text-xs text-slate-400">{guild.members.length} members • {guild.total_distance.toFixed(1)} km</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleJoinGuild(guild.id)}
                  className="rounded-full bg-violet-600 hover:bg-violet-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
                >
                  Join
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400 font-bold">XP</p>
                  <p className="font-black text-amber-600 text-xs mt-0.5">{guild.total_xp}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400 font-bold">Shared XP</p>
                  <p className="font-black text-slate-800 text-xs mt-0.5">{guild.shared_xp}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400 font-bold">Members</p>
                  <p className="font-black text-slate-800 text-xs mt-0.5">{guild.members.length}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 4. 챔피언 배너 */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Current champion</p>
        <h2 className="mt-1 text-lg font-black text-slate-900">{topGuild?.name ?? 'No guild ranked yet'}</h2>
        <p className="mt-1 text-xs text-slate-600">
          {topGuild ? `${topGuild.total_xp} XP from live guild contributions.` : 'Start a guild and run the first route.'}
        </p>
      </div>

      {/* 5. 실시간 상태 안내 */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase text-violet-600 tracking-wider">Live operations</p>
        <h2 className="mt-1 text-sm font-black text-slate-900">Guild competition is active</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Guild XP and distance update from completed real RunQuest activities. Challenge and feed
          publishing are synced automatically.
        </p>
      </div>
    </section>
  );
}
