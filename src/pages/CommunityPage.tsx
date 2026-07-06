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
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Live guild board</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Run with your city crew</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Create guilds, join crews, and build shared XP from real RunQuest activity.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-950 p-3 text-sm text-stone-300">{status}</p>
      </div>

      <form onSubmit={(event) => void handleCreateGuild(event)} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
        <p className="text-xs font-black uppercase text-quest-teal">Create guild</p>
        <div className="mt-3 flex gap-2">
          <input
            value={guildName}
            onChange={(event) => setGuildName(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-sm"
            placeholder="BGC Night Runners"
          />
          <button type="submit" className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-stone-950">
            Create
          </button>
        </div>
      </form>

      <div>
        <h2 className="font-black">Guild leaderboard</h2>
        {loading && <p className="mt-3 rounded-2xl bg-stone-900 p-4 text-sm">Loading guilds...</p>}
        {!loading && guilds.length === 0 && (
          <p className="mt-3 rounded-2xl bg-stone-900 p-4 text-sm text-stone-400">No guilds found.</p>
        )}
        <div className="mt-3 grid gap-3">
          {guilds.map((guild, index) => (
            <article key={guild.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">Rank #{index + 1}</p>
                  <h3 className="mt-1 text-xl font-black">{guild.name}</h3>
                  <p className="mt-1 text-sm text-stone-400">
                    {guild.members.length} members / {guild.total_distance.toFixed(1)} km
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleJoinGuild(guild.id)}
                  className="rounded-full bg-quest-teal px-3 py-2 text-xs font-black text-white"
                >
                  Join
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-stone-950 p-3">
                  <p className="text-xs text-stone-400">XP</p>
                  <p className="font-black text-amber-200">{guild.total_xp}</p>
                </div>
                <div className="rounded-xl bg-stone-950 p-3">
                  <p className="text-xs text-stone-400">Shared XP</p>
                  <p className="font-black text-stone-50">{guild.shared_xp}</p>
                </div>
                <div className="rounded-xl bg-stone-950 p-3">
                  <p className="text-xs text-stone-400">Members</p>
                  <p className="font-black text-stone-50">{guild.members.length}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Current champion</p>
        <h2 className="mt-2 text-2xl font-black">{topGuild?.name ?? 'No guild ranked yet'}</h2>
        <p className="mt-2 text-sm text-stone-400">
          {topGuild ? `${topGuild.total_xp} XP from live guild contributions.` : 'Start a guild and run the first route.'}
        </p>
      </div>

      <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
        <p className="text-xs font-black uppercase text-quest-teal">Live operations</p>
        <h2 className="mt-2 text-xl font-black">Guild competition is active</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Guild XP and distance update from completed real RunQuest activities. Challenge and feed
          publishing can be layered on this same Supabase event stream.
        </p>
      </div>
    </section>
  );
}
