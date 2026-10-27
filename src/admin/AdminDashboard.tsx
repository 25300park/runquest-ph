import { Component, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboardStats,
  subscribeToAdminRealtime,
  getGmLiveRunners,
  getGmRaidEvents,
  createGmRaidEvent,
  getGmFactionWarScores,
  getGmAbuseLogs,
  toggleUserBan,
  type GmLiveRunner,
  type GmRaidEvent,
  type GmFactionScore,
  type GmAbuseLog
} from './adminService';
import AdminCharacters from './AdminCharacters';
import AdminCourses from './AdminCourses';
import AdminEconomy from './AdminEconomy';
import AdminCheatMonitor from './AdminCheatMonitor';
import LiveMapRadar from './components/LiveMapRadar';
import RaidManagerModal from './components/RaidManagerModal';
import FactionWarCard from './components/FactionWarCard';
import GpsAbuseFeed from './components/GpsAbuseFeed';
import { getEnvironmentHealth } from '../utils/environment';

type DashboardStats = Awaited<ReturnType<typeof getAdminDashboardStats>>;
type AdminTab = 'radar' | 'faction' | 'cheat' | 'economy' | 'characters' | 'courses';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('radar');
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [status, setStatus] = useState('Loading admin dashboard...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // GM Realtime States
  const [runners, setRunners] = useState<GmLiveRunner[]>([]);
  const [raids, setRaids] = useState<GmRaidEvent[]>([]);
  const [factions, setFactions] = useState<GmFactionScore[]>([]);
  const [abuseLogs, setAbuseLogs] = useState<GmAbuseLog[]>([]);
  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
  const [modalCoords, setModalCoords] = useState<{ lat: number; lng: number } | null>(null);

  const environmentHealth = getEnvironmentHealth();

  async function loadDashboardData() {
    try {
      const [statsData, runnersData, raidsData, factionsData, abuseData] = await Promise.allSettled([
        getAdminDashboardStats(),
        getGmLiveRunners(),
        getGmRaidEvents(),
        getGmFactionWarScores(),
        getGmAbuseLogs()
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
      }
      if (runnersData.status === 'fulfilled' && runnersData.value) {
        setRunners(runnersData.value);
      }
      if (raidsData.status === 'fulfilled' && raidsData.value) {
        setRaids(raidsData.value);
      }
      if (factionsData.status === 'fulfilled' && factionsData.value) {
        setFactions(factionsData.value);
      }
      if (abuseData.status === 'fulfilled' && abuseData.value) {
        setAbuseLogs(abuseData.value);
      }

      setStatus('Realtime PostGIS GM Control Center Active');
      setError('');
    } catch (err) {
      console.warn('Admin dashboard error:', err);
      setError('Admin system error');
      setStatus('Failed to load admin dashboard (fallback active).');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();

    const unsubscribe = subscribeToAdminRealtime(() => {
      void loadDashboardData();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  async function handleCreateRaid(data: Omit<GmRaidEvent, 'id' | 'status' | 'participants_count'>) {
    const created = await createGmRaidEvent(data);
    setRaids((prev) => [created, ...prev]);
  }

  async function handleToggleBan(userId: string, isBanned: boolean, reason?: string) {
    await toggleUserBan(userId, isBanned, reason);
    setAbuseLogs((prev) =>
      prev.map((log) => (log.user_id === userId ? { ...log, is_banned: isBanned } : log))
    );
  }

  function handleOpenRaidModal(coords: { lat: number; lng: number }) {
    setModalCoords(coords);
    setIsRaidModalOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 text-white">
        <section className="rounded-lg border border-stone-800 bg-stone-950 p-4">
          Loading GM Operations Control Center...
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
    <div data-testid="admin-dashboard" className="min-h-screen space-y-5 bg-black text-white p-4">
      {/* HEADER & ENVIRONMENT SUMMARY */}
      <section className="rounded-xl border border-stone-800 bg-stone-950 p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs font-black uppercase text-amber-300 border border-amber-400/30">
                O2O GAME MASTER CONTROL
              </span>
              <span className="text-xs text-emerald-400 font-bold">● PostGIS Engine Online</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              RunQuest Operations & Live Command
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              {status}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenRaidModal({ lat: 14.5573, lng: 121.0232 })}
              className="rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-rose-500"
            >
              ⚡ Deploy Guerrilla Raid
            </button>
            <Link
              to="/admin/test-agent"
              className="rounded-lg border border-amber-300/40 bg-stone-900 px-3 py-2 text-xs font-black text-amber-200 hover:bg-stone-800"
            >
              Test Agent
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-800/80 pt-3 text-xs text-stone-400">
          <span>Mode: <b className="text-stone-200">{environmentHealth.mode}</b></span>
          <span>Supabase: <b className="text-stone-200">{environmentHealth.supabaseConfigured ? 'Configured' : 'Offline / Mock'}</b></span>
          <span>Active Factions: <b className="text-amber-400">Makati Tigers</b> vs <b className="text-blue-400">BGC Eagles</b></span>
        </div>
      </section>

      {/* TOP KPI STATS BAR */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active Runners', runners.length, '🟢'],
          ['Live Raids / Bosses', raids.filter(r => r.status === 'ACTIVE').length, '👾'],
          ['Flagged Spoofing', abuseLogs.length, '🚨'],
          ['Total Users', stats.users ?? 0, '👥'],
          ['Courses Approved', stats.courses ?? 0, '🗺️'],
          ['Token Supply', stats.tokenSupply ?? 0, '🪙'],
          ['Active Races', stats.liveRaces ?? 0, '🏁'],
          ['Guilds', stats.guilds ?? 0, '⚔️']
        ].map(([label, value, icon]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-stone-800/90 bg-stone-950 p-4 transition-all hover:border-stone-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
              <span className="text-sm">{icon}</span>
            </div>
            <p className="text-2xl font-black text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-2">
        {[
          ['radar', '🗺️ Live Map Radar'],
          ['faction', '⚔️ Faction War'],
          ['cheat', '🚨 GPS Anti-Cheat'],
          ['economy', '🪙 Economy & Tokens'],
          ['characters', '👤 Characters'],
          ['courses', '🛣️ Courses']
        ].map(([key, label]) => (
          <button
            key={key}
            data-testid={`admin-tab-${key}`}
            onClick={() => setActiveTab(key as AdminTab)}
            className={`rounded-lg px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === key
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-4">
        {activeTab === 'radar' && (
          <div className="space-y-4">
            <LiveMapRadar
              runners={runners}
              raids={raids}
              onOpenRaidModal={handleOpenRaidModal}
            />
            <FactionWarCard factions={factions} />
          </div>
        )}

        {activeTab === 'faction' && (
          <div className="space-y-4">
            <FactionWarCard factions={factions} />
          </div>
        )}

        {activeTab === 'cheat' && (
          <div className="space-y-4">
            <GpsAbuseFeed logs={abuseLogs} onToggleBan={handleToggleBan} />
            <AdminCheatMonitor />
          </div>
        )}

        {activeTab === 'economy' && (
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4">
            <AdminEconomy />
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4">
            <AdminCharacters />
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4">
            <AdminCourses />
          </div>
        )}
      </div>

      {/* RAID MANAGER MODAL */}
      <RaidManagerModal
        isOpen={isRaidModalOpen}
        initialCoords={modalCoords}
        onClose={() => setIsRaidModalOpen(false)}
        onSubmit={handleCreateRaid}
      />
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
