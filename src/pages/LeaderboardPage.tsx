import { useEffect, useState } from 'react';
import {
  getLeaderboard,
  subscribeToLeaderboard,
  type LeaderboardRegion,
  type LeaderboardRow
} from '../features/leaderboard/leaderboardService';

const regions: LeaderboardRegion[] = ['Global', 'BGC', 'Makati', 'MOA'];

export default function LeaderboardPage() {
  const [region, setRegion] = useState<LeaderboardRegion>('Global');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState('Loading leaderboard...');

  useEffect(() => {
    let isMounted = true;

    async function loadRows() {
      try {
        const nextRows = await getLeaderboard(region);
        if (isMounted) {
          setRows(nextRows);
          setStatus('');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load leaderboard.';
        setStatus(message);
      }
    }

    loadRows();
    const unsubscribe = subscribeToLeaderboard(region, loadRows);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [region]);

  return (
    <section className="min-h-full bg-[#111816] px-4 py-5 text-stone-50">
      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">PvP leaderboard</p>
        <h1 className="mt-2 text-3xl font-black">Weekly running ranks</h1>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {regions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRegion(item)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black ${
              region === item
                ? 'border-amber-200 bg-amber-300 text-stone-950'
                : 'border-stone-700 bg-stone-900 text-stone-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {status && <p className="mt-4 rounded-2xl bg-stone-900 p-4 text-sm">{status}</p>}

      <div className="mt-4 grid gap-3">
        {rows.map((row, index) => (
          <article key={row.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-quest-teal">Rank #{index + 1}</p>
                <h2 className="mt-1 font-black">Character {row.character_id?.slice(0, 8)}</h2>
              </div>
              <p className="text-2xl font-black text-amber-200">{Math.round(row.weekly_score)}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-stone-950 p-2">
                <p className="text-stone-500">Distance</p>
                <p className="font-black">{row.total_distance.toFixed(1)}</p>
              </div>
              <div className="rounded-xl bg-stone-950 p-2">
                <p className="text-stone-500">XP</p>
                <p className="font-black">{row.total_xp}</p>
              </div>
              <div className="rounded-xl bg-stone-950 p-2">
                <p className="text-stone-500">Level</p>
                <p className="font-black">{row.level}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
