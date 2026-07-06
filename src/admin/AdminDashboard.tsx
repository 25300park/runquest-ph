import { Component, useEffect, useState, type ReactNode } from 'react';
import { getAdminDashboardStats, subscribeToAdminRealtime } from './adminService';
import AdminCharacters from './AdminCharacters';
import AdminCourses from './AdminCourses';
import AdminEconomy from './AdminEconomy';
import AdminCheatMonitor from './AdminCheatMonitor';
import { getEnvironmentHealth } from '../utils/environment';

type DashboardStats = Awaited<ReturnType<typeof getAdminDashboardStats>>;
type AdminTab = 'characters' | 'courses' | 'economy' | 'cheat';

const emptyStats: DashboardStats = {
  users: 0,
  characters: 0,
  courses: 0,
  flaggedReports: 0,
  tokenSupply: 0,
  liveRaces: 0,
  guilds: 0
};

class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Admin system error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-red-100">
          Admin system temporarily unavailable.
        </section>
      );
    }

    return this.props.children;
  }
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('characters');

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [status, setStatus] = useState('Loading admin dashboard...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const environmentHealth = getEnvironmentHealth();

  async function loadStats() {
    try {
      const data = await getAdminDashboardStats();
      setStats(data ?? emptyStats);
      setStatus('Realtime admin system active.');
      setError('');
    } catch (error) {
      console.warn('Admin dashboard error:', error);
      setStats(emptyStats);
      setError('Admin system error');
      setStatus('Failed to load admin dashboard (check Supabase connection).');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();

    const unsubscribe = subscribeToAdminRealtime(() => {
      void loadStats();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 text-white">
        <section className="rounded-lg border border-stone-800 bg-stone-950 p-4">
          Loading Admin...
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 text-white">
        <section className="rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-red-100">
          Admin system error
        </section>
      </div>
    );
  }

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
        <div className="mt-3 rounded-md bg-stone-900 p-3 text-xs text-stone-300">
          <p>Environment: {environmentHealth.mode}</p>
          <p>Supabase: {environmentHealth.supabaseConfigured ? 'configured' : 'missing env'}</p>
          {!environmentHealth.ready && (
            <p className="mt-1 text-red-200">{environmentHealth.messages.join(' ')}</p>
          )}
        </div>
      </section>

      {/* STATS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Users', stats.users ?? 0],
          ['Characters', stats.characters ?? 0],
          ['Courses', stats.courses ?? 0],
          ['Flagged', stats.flaggedReports ?? 0],
          ['Tokens', stats.tokenSupply ?? 0],
          ['Live Races', stats.liveRaces ?? 0],
          ['Guilds', stats.guilds ?? 0]
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
            onClick={() => setActiveTab(key as AdminTab)}
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

export default function AdminDashboard() {
  return (
    <AdminErrorBoundary>
      <AdminDashboardContent />
    </AdminErrorBoundary>
  );
}
