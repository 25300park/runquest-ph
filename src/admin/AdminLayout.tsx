import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOutAdmin } from './adminService';

const adminNav = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/characters', label: 'Characters' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/economy', label: 'Economy' },
  { to: '/admin/cheat-monitor', label: 'Cheat Monitor' }
];

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <section className="min-h-screen bg-[#101412] text-stone-100">
      <header className="border-b border-stone-800 bg-stone-950 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-amber-200">RunQuest PH Admin</p>
            <h1 className="text-xl font-black">Control Console</h1>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-md border border-stone-700 px-3 py-2 text-sm font-bold text-stone-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 md:grid-cols-[220px_1fr]">
        <nav className="grid gap-2 self-start rounded-lg border border-stone-800 bg-stone-950 p-2">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-bold ${
                  isActive ? 'bg-amber-300 text-stone-950' : 'text-stone-400 hover:bg-stone-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </section>
  );
}
