import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOutAdmin } from './adminService';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOutAdmin();
    navigate('/', { replace: true });
  }

  const navItems = [
    { label: '🗺️ Live Operations', to: '/admin/dashboard' },
    { label: '💰 Revenue & Economy', to: '/admin/revenue' },
    { label: '📈 Investor Metrics', to: '/admin/investor' },
    { label: '📋 Ops Board', to: '/admin/board' },
    { label: '🤖 Test Agent', to: '/admin/test-agent' }
  ];

  return (
    <section className="min-h-screen bg-[#0c0f0d] text-stone-100 font-sans">
      <header className="border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20">
              GM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">RunQuest PH</p>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  ● RADAR ONLINE
                </span>
              </div>
              <h1 className="text-base font-black tracking-tight text-white">Game Master Command Console</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/character-dashboard"
              className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-stone-800 transition-all"
            >
              Exit to App
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 space-y-4">
        {/* Navigation Bar */}
        <nav className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-stone-800/60">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === '/admin/dashboard' && location.pathname === '/admin');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-lg px-3.5 py-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-black'
                    : 'bg-stone-900/80 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Outlet />
      </main>
    </section>
  );
}
