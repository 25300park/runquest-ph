import type { ReactNode } from 'react';
import { BrowserRouter, Link, NavLink, useLocation } from 'react-router-dom';
import { appRoutes } from './routes';

const navItems = [
  { to: '/map', label: 'Map' },
  { to: '/coach', label: 'Coach' },
  { to: '/community', label: 'Crew' },
  { to: '/profile', label: 'Profile' }
];

function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0f1412] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#111816] shadow-soft">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-800 bg-[#111816]/95 px-4 py-3 backdrop-blur">
          <Link to="/" className="flex items-center gap-2 font-black text-stone-50">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-amber-200 bg-quest-teal text-white">
              RQ
            </span>
            <span>RunQuest PH</span>
          </Link>
          <Link
            to="/advanced-courses"
            className="rounded-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm font-black text-amber-100"
          >
            Advanced
          </Link>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-stone-800 bg-[#111816] px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-center text-xs font-semibold ${
                  isActive ? 'bg-teal-950 text-quest-teal' : 'text-stone-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>{appRoutes}</AppShell>
    </BrowserRouter>
  );
}
