import { Link, Outlet, useNavigate } from 'react-router-dom';
import { signOutAdmin } from './adminService';

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutAdmin();
    navigate('/', { replace: true });
  }

  return (
    <section className="min-h-screen bg-[#101412] text-stone-100">
      <header className="border-b border-stone-800 bg-stone-950 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-amber-200">RunQuest PH Admin</p>
            <h1 className="text-xl font-black">Operations Dashboard</h1>
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

      <main className="mx-auto max-w-6xl px-4 py-4">
        <nav className="mb-4 flex gap-2 overflow-x-auto text-sm font-bold">
          <Link className="rounded-md border border-stone-700 px-3 py-2 text-stone-300" to="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-md border border-stone-700 px-3 py-2 text-stone-300" to="/admin/revenue">
            Revenue
          </Link>
          <Link className="rounded-md border border-stone-700 px-3 py-2 text-stone-300" to="/admin/investor">
            Investor
          </Link>
          <Link className="rounded-md border border-stone-700 px-3 py-2 text-stone-300" to="/admin/board">
            Board
          </Link>
          <Link className="rounded-md border border-stone-700 px-3 py-2 text-stone-300" to="/admin/test-agent">
            Test Agent
          </Link>
        </nav>
        <Outlet />
      </main>
    </section>
  );
}
