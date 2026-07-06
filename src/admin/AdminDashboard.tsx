import { useEffect, useState } from 'react';
import { getAdminDashboardStats, subscribeToAdminRealtime } from './adminService';

type DashboardStats = Awaited<ReturnType<typeof getAdminDashboardStats>>;

const emptyStats: DashboardStats = {
  users: 0,
  characters: 0,
  courses: 0,
  flaggedReports: 0,
  tokenSupply: 0,
  liveRaces: 0,
  guilds: 0
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [status, setStatus] = useState('Loading live control data...');

  async function loadStats() {
    try {
      setStats(await getAdminDashboardStats());
      setStatus('Realtime monitoring active.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load admin dashboard.');
    }
  }

  useEffect(() => {
    void loadStats();
    return subscribeToAdminRealtime(() => void loadStats());
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Live operations</p>
        <h2 className="mt-1 text-2xl font-black">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Users', stats.users],
          ['Characters', stats.characters],
          ['Courses', stats.courses],
          ['Flagged runs', stats.flaggedReports],
          ['RunToken supply', stats.tokenSupply],
          ['Live races', stats.liveRaces],
          ['Guilds', stats.guilds]
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <p className="text-xs font-black uppercase text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-stone-50">{value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
