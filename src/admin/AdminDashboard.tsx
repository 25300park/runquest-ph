import { useEffect, useState } from 'react';
import { getAdminDashboardStats, subscribeToAdminRealtime } from './adminService';
import AdminCharacters from './AdminCharacters';
import AdminCourses from './AdminCourses';
import AdminEconomy from './AdminEconomy';
import AdminCheatMonitor from './AdminCheatMonitor';

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
  const [activeTab, setActiveTab] =
    useState<'characters' | 'courses' | 'economy' | 'cheat'>('characters');

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [status, setStatus] = useState('Loading admin dashboard...');

  async function loadStats() {
    try {
      const data = await getAdminDashboardStats();

      if (!data) {
        setStatus('No admin data returned from Supabase.');
        return;
      }

      setStats(data);
      setStatus('Realtime admin system active.');
    } catch (error) {
      console.error('Admin dashboard error:', error);
      setStatus('Failed to load admin dashboard (check Supabase connection).');
    }
  }

  useEffect(() => {
    loadStats();

    const unsubscribe = subscribeToAdminRealtime(() => {
      loadStats();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen space-y-4 bg-black text-white p-4">

      {/* HEADER */}
      <section className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-bold uppercase text-amber-300">
          ADMIN CONTROL CENTER
        </p>

        <h1 className="text-2xl font-black">RunQuest Admin Dashboard</h1>

        <p className="text-sm text-stone-400 mt-2">
          {status}
        </p>
      </section>

      {/* STATS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Users', stats.users],
          ['Characters', stats.characters],
          ['Courses', stats.courses],
          ['Flagged', stats.flaggedReports],
          ['Tokens', stats.tokenSupply],
          ['Live Races', stats.liveRaces],
          ['Guilds', stats.guilds]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-stone-800 bg-stone-950 p-4"
          >
            <p className="text-xs text-stone-500 uppercase">{label}</p>
            <p className="text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="grid grid-cols-4 gap-2">
        {[
          ['characters', 'Characters'],
          ['courses', 'Courses'],
          ['economy', 'Economy'],
          ['cheat', 'Cheat']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`p-3 text-xs font-bold rounded ${
              activeTab === key
                ? 'bg-amber-300 text-black'
                : 'bg-stone-900 text-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="border border-stone-800 rounded-lg p-4">
        {activeTab === 'characters' && <AdminCharacters />}
        {activeTab === 'courses' && <AdminCourses />}
        {activeTab === 'economy' && <AdminEconomy />}
        {activeTab === 'cheat' && <AdminCheatMonitor />}
      </div>
    </div>
  );
}