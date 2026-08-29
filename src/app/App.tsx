import type { ReactNode } from 'react';
import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import { appRoutes } from './routes';
import BottomNav from '../components/layout/BottomNav';
import PwaInstallBanner from '../components/pwa/PwaInstallBanner';
import ErrorBoundary from '../components/common/ErrorBoundary';

function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isFullScreenRoute =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/course-builder' ||
    location.pathname.startsWith('/course-builder/') ||
    location.pathname === '/run' ||
    location.pathname.startsWith('/activity/');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-950 flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-50 relative shadow-2xl">
        <PwaInstallBanner />

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
          <Link to="/character-dashboard" className="flex items-center gap-2 font-black text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-violet-500/20">
              RQ
            </span>
            <span className="tracking-tight text-base font-extrabold">RunQuest PH</span>
          </Link>
          <Link
            to="/advanced-courses"
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
          >
            Advanced
          </Link>
        </header>

        <main className="flex-1 pb-16">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>{appRoutes}</AppShell>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
