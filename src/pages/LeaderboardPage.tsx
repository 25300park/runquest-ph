import { useEffect, useState } from 'react';
import {
  getGlobalLeaderboard,
  type GlobalRegion
} from '../services/globalLeaderboardService';
import type { Database } from '../types/database';

type GlobalLeaderboardRow = Database['public']['Tables']['leaderboard_global']['Row'];

const regions: GlobalRegion[] = ['Global', 'Philippines', 'Korea'];

export default function LeaderboardPage() {
  const [region, setRegion] = useState<GlobalRegion>('Global');
  const [rows, setRows] = useState<GlobalLeaderboardRow[]>([]);
  const [status, setStatus] = useState('Loading global leaderboard...');

  useEffect(() => {
    let active = true;

    async function loadRows() {
      try {
        const nextRows = await getGlobalLeaderboard(region);
        if (!active) return;
        setRows(nextRows);
        setStatus(nextRows.length === 0 ? 'No global ranking data yet.' : 'Global ranking live.');
      } catch (error) {
        if (!active) return;
        setRows([]);
        setStatus(error instanceof Error ? error.message : 'Unable to load leaderboard.');
      }
    }

    void loadRows();
    return () => {
      active = false;
    };
  }, [region]);

  return (
    <section className="min-h-full bg-[#111816] px-4 py-5 text-stone-50">
      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">Global leaderboard</p>
        <h1 className="mt-2 text-3xl font-black">Weekly world ranks</h1>
        <p className="mt-3 text-sm text-stone-400">{status}</p>
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

      <div className="mt-4 grid gap-3">
        {rows.map((row, index) => (
          <article key={row.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-quest-teal">Rank #{index + 1}</p>
                <h2 className="mt-1 font-black">Runner {row.character_id?.slice(0, 8) ?? 'global'}</h2>
                <p className="mt-1 text-xs text-stone-500">{row.timezone}</p>
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
                <p className="text-stone-500">Season</p>
                <p className="font-black">{Math.round(row.season_score)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
